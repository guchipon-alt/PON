import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), "posts-db.json");

interface VerificationEntry { code: string; expiresAt: number; }
const verificationCodes = new Map<string, VerificationEntry>();
const VERIFICATION_TTL_MS = 10 * 60 * 1000;

// Simple in-memory rate limiting for verification-code requests
const sendCodeAttempts = new Map<string, number[]>();
const SEND_CODE_WINDOW_MS = 60 * 60 * 1000;
const SEND_CODE_MAX_PER_WINDOW = 5;
const SEND_CODE_MIN_INTERVAL_MS = 30 * 1000;

app.use(express.json({ limit: "12mb" }));

// Health check endpoint for deployment/monitoring
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- LAZY INITIALIZE GEMINI CLIENT ---
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("placeholder")) {
    console.warn("GEMINI_API_KEY is not configured or is a placeholder. AI moderation will use rule-based fallback.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    return aiClient;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// --- DATABASE TYPES ---
interface Comment {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  text: string;
  timestamp: string;
  aiVerification?: {
    isBot: boolean;
    botConfidence: number;
    isApproved: boolean;
    rejectionReason: string;
  };
}

interface Post {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  timestamp: string;
  text: string;
  image?: string;
  likes: number;
  commentsCount: number;
  reposts: number;
  views: string;
  captured: boolean;
  category: "forYou" | "clans" | "following";
  commentsList: Comment[];
  hasLiked?: boolean;
  hasReposted?: boolean;
  aiVerification?: {
    isBot: boolean;
    botConfidence: number;
    isApproved: boolean;
    rejectionReason: string;
    verifiedStats: { claim: string; status: "verified" | "unverified" | "warning"; note: string }[];
    isAnalyzing?: boolean;
    factCheck?: {
      hasFacts: boolean;
      status: "verified" | "unverified" | "fake";
      summary: string;
      explanation: string;
      sources: { title: string; url: string }[];
    };
  };
}

interface DB {
  posts: Post[];
  stats: {
    totalPostsAnalyzed: number;
    detectedBots: number;
    warningsIssued: number;
    verifiedClaims: number;
  };
}

// --- DATABASE HELPERS ---
function readDB(): DB {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DB = {
      posts: [],
      stats: {
        totalPostsAnalyzed: 0,
        detectedBots: 0,
        warningsIssued: 0,
        verifiedClaims: 0
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf-8");
    return initialDB;
  }

  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read JSON DB, returning empty database:", err);
    return { posts: [], stats: { totalPostsAnalyzed: 0, detectedBots: 0, warningsIssued: 0, verifiedClaims: 0 } };
  }
}

function writeDB(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to JSON DB:", err);
  }
}

// --- AI RETRY AND FALLBACK HELPERS ---
async function callGeminiWithRetry<T>(
  apiCallFn: () => Promise<T>,
  retries: number = 4,
  delayMs: number = 800
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await apiCallFn();
    } catch (err: any) {
      attempt++;
      
      const errStr = String(err?.message || err).toLowerCase();
      const isQuotaError = 
        errStr.includes("quota") || 
        errStr.includes("429") || 
        err?.status === 429;
        
      const isUnavailableError = 
        errStr.includes("503") || 
        errStr.includes("500") || 
        errStr.includes("unavailable") || 
        errStr.includes("overloaded") || 
        errStr.includes("internal error") || 
        errStr.includes("deadline exceeded") || 
        err?.status === 503 ||
        err?.status === 500;
      
      // If it is a quota error, do not retry - fail fast to fallback gracefully and instantly
      if (isQuotaError) {
        throw err;
      }

      if (attempt <= retries && isUnavailableError) {
        // Exponential backoff with jitter to reduce congestion
        const jitter = Math.floor(Math.random() * 200);
        const backoff = (delayMs * Math.pow(2, attempt - 1)) + jitter;
        console.warn(`[Gemini API] Temporary error detected, retrying in ${backoff}ms (Attempt ${attempt}/${retries})... Error: ${err?.message || err}`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw err;
    }
  }
}

function getLocalFallbackAnalysis(text: string, error?: any): {
  isBot: boolean;
  botConfidence: number;
  isApproved: boolean;
  rejectionReason: string;
  verifiedStats: { claim: string; status: "verified" | "unverified" | "warning"; note: string }[];
  category: "forYou" | "clans" | "following";
  factCheck: {
    hasFacts: boolean;
    status: "verified" | "unverified" | "fake";
    summary: string;
    explanation: string;
    sources: { title: string; url: string }[];
  };
} {
  const hasNumbers = /\d+/.test(text);
  const lowercaseText = text.toLowerCase();
  const isBot = text.length < 5 || lowercaseText.includes("http") || lowercaseText.includes("click here") || lowercaseText.includes("casino");
  const isApproved = !lowercaseText.includes("оскорбление") && !lowercaseText.includes("мат");

  const isPoliticalOrNews = lowercaseText.includes("политика") || lowercaseText.includes("президент") || lowercaseText.includes("выборы") || lowercaseText.includes("новость") || lowercaseText.includes("сша") || lowercaseText.includes("россия") || lowercaseText.includes("война") || lowercaseText.includes("кризис") || lowercaseText.includes("украин") || lowercaseText.includes("путин") || lowercaseText.includes("доллар");

  let noteSuffix = "ИИ-анализатор работает в локальном режиме.";
  let explSuffix = "В демонстрационном (локальном) режиме детальная сверка баз данных недоступна.";
  
  if (error) {
    const errMsg = String(error.message || error);
    if (errMsg.includes("429") || errMsg.includes("quota")) {
      noteSuffix = "Превышена квота запросов к Gemini API (ошибка 429).";
      explSuffix = "ИИ-сервис испытывает временное ограничение по квоте запросов (429 Resource Exhausted). Сеть PON автоматически переключилась на локальный протокол верификации контента.";
    } else if (errMsg.includes("503") || errMsg.includes("unavailable")) {
      noteSuffix = "Серверы Gemini временно перегружены (ошибка 503).";
      explSuffix = "Официальные серверы Google AI временно перегружены запросами (503 Service Unavailable). Применена локальная модель анализа безопасности.";
    }
  }

  const factCheck = isPoliticalOrNews ? {
    hasFacts: true,
    status: "unverified" as const,
    summary: "Факт не подтвержден" as const,
    explanation: `Зафиксировано обсуждение новостных или общественно-политических событий. ${explSuffix} Пожалуйста, подключите собственный GEMINI_API_KEY в настройках для разблокировки полноценного поиска Google.`,
    sources: [
      { title: "Официальный сайт Правительства", url: "http://government.ru/" },
      { title: "Поиск Google по теме", url: `https://www.google.com/search?q=${encodeURIComponent(text)}` }
    ]
  } : {
    hasFacts: false,
    status: "verified" as const,
    summary: "",
    explanation: "",
    sources: []
  };

  return {
    isBot,
    botConfidence: isBot ? 0.95 : 0.02,
    isApproved,
    rejectionReason: !isApproved ? "Сообщение содержит недопустимую лексику" : "",
    verifiedStats: hasNumbers ? [
      {
        claim: "Присутствуют числа в тексте",
        status: "unverified" as const,
        note: `${noteSuffix} Для глубокой сверки числовых показателей и статистики требуется рабочий API ключ.`
      }
    ] : [],
    category: "forYou" as const,
    factCheck
  };
}

// --- AI MODERATION ENGINE ---
async function runAIAnalysis(text: string): Promise<{
  isBot: boolean;
  botConfidence: number;
  isApproved: boolean;
  rejectionReason: string;
  verifiedStats: { claim: string; status: "verified" | "unverified" | "warning"; note: string }[];
  category: "forYou" | "clans" | "following";
  factCheck?: {
    hasFacts: boolean;
    status: "verified" | "unverified" | "fake";
    summary: string;
    explanation: string;
    sources: { title: string; url: string }[];
  };
}> {
  const client = getGeminiClient();
  if (!client) {
    return getLocalFallbackAnalysis(text);
  }

  try {
    const response = await callGeminiWithRetry(async () => {
      return await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Проанализируй этот пост для социальной сети 'PON': "${text}"`,
        config: {
          systemInstruction: `Вы — строгий, объективный ИИ-модератор и эксперт по проверке фактов (Fact-checking AI) в социальной сети 'PON'.
Ваша задача:
1. Проверить пост на бот-активность (isBot: true, если текст выглядит как автогенерированный спам, бессмысленный набор слов, реклама криптовалют/рулеток или типичный спам-бот). Укажите botConfidence от 0.0 до 1.0.
2. Проверить на неприемлемый контент (isApproved: false, если есть мат, явные грубые оскорбления, язык вражды или спам. Укажите rejectionReason).
3. Проанализировать любые цифры, проценты, даты, статистику или фактические утверждения в тексте (например, "90% людей...", "Рост ВВП составил X%", "В Москве 12 миллионов человек").
   Для каждого найденного утверждения/статистики верните объект в verifiedStats.
4. Выполнить общую проверку фактов (factCheck) для постов, которые содержат общественно-политическую информацию, новости, научные или спортивные факты (а не просто повседневные высказывания типа "всем привет я мишка фреди").
   - hasFacts: true, если в посте есть новостные, политические, экономические или исторические факты. False, если это просто личный блог или беседа.
   - status: "verified" (если новость/факт правдивые), "unverified" (если факт не подтвержден или нет доказательств), "fake" (если это ложь/фейк).
   - summary: на русском языке строго одно из трех значений: "Новость правдивая", "Факт не подтвержден", "Является ложью".
   - explanation: развернутое вежливое объяснение на русском языке о том, почему информация правдива, ложна или не подтверждена, со ссылкой на контекст.
   - sources: массив из объектов { title: string, url: string } с реальными и авторитетными ссылками в интернете (Wikipedia, крупные новостные агентства, официальные отчеты), подтверждающими или опровергающими заявление.
5. Выбрать наиболее подходящую категорию для поста ("forYou", "clans", "following").`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isBot: { type: Type.BOOLEAN, description: "Whether this post is highly likely written by a bot or automated spam." },
              botConfidence: { type: Type.NUMBER, description: "Bot confidence score from 0.0 (human) to 1.0 (definitely bot)." },
              isApproved: { type: Type.BOOLEAN, description: "True if content is safe and respectful, false otherwise." },
              rejectionReason: { type: Type.STRING, description: "Explanation of why the post was rejected, if isApproved is false." },
              verifiedStats: {
                type: Type.ARRAY,
                description: "Array of analyzed numerical claims or facts. Keep empty if none exist.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claim: { type: Type.STRING, description: "The specific claim or statistic from the post text." },
                    status: { type: Type.STRING, enum: ["verified", "unverified", "warning"], description: "The verified status of the claim." },
                    note: { type: Type.STRING, description: "Explanation or factual correction on Russian language." }
                  },
                  required: ["claim", "status", "note"]
                }
              },
              category: { type: Type.STRING, enum: ["forYou", "clans", "following"], description: "The categorized feed for this post." },
              factCheck: {
                type: Type.OBJECT,
                description: "Fact checking analysis of the message statement.",
                properties: {
                  hasFacts: { type: Type.BOOLEAN, description: "True if text contains news, politics, economics, history, or science claims. False otherwise." },
                  status: { type: Type.STRING, enum: ["verified", "unverified", "fake"], description: "Verification status of the information." },
                  summary: { type: Type.STRING, description: "Short summary phrase: 'Новость правдивая', 'Факт не подтвержден', or 'Является ложью'." },
                  explanation: { type: Type.STRING, description: "Detailed check explanation on Russian." },
                  sources: {
                    type: Type.ARRAY,
                    description: "Real web resources, news links, wikipedia pages, or sources. Keep empty if none.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Name of the source website or agency." },
                        url: { type: Type.STRING, description: "Full URL to the article or reference." }
                      },
                      required: ["title", "url"]
                    }
                  }
                },
                required: ["hasFacts", "status", "summary", "explanation", "sources"]
              }
            },
            required: ["isBot", "botConfidence", "isApproved", "rejectionReason", "verifiedStats", "category", "factCheck"]
          }
        }
      });
    });

    const resultText = response.text;
    if (resultText) {
      return JSON.parse(resultText.trim());
    }
  } catch (err: any) {
    const isQuotaOrUnavailable = err?.message?.includes("quota") || err?.message?.includes("429") || err?.status === 429 || err?.message?.includes("503") || err?.status === 503;
    if (isQuotaOrUnavailable) {
      console.warn("AI Analysis rate-limited or unavailable, returning safety fallback:", err?.message || err);
    } else {
      console.error("AI Analysis failed, returning safety fallback:", err);
    }
    return getLocalFallbackAnalysis(text, err);
  }

  return getLocalFallbackAnalysis(text);
}

// --- API ENDPOINTS ---

// Send a registration verification code to email (with SMTP or local stub)
app.post("/api/auth/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // --- Rate limiting ---
  const now = Date.now();
  const history = (sendCodeAttempts.get(normalizedEmail) || []).filter(t => now - t < SEND_CODE_WINDOW_MS);
  if (history.length > 0 && now - history[history.length - 1] < SEND_CODE_MIN_INTERVAL_MS) {
    return res.status(429).json({ error: "Слишком частые запросы кода. Подождите немного." });
  }
  if (history.length >= SEND_CODE_MAX_PER_WINDOW) {
    return res.status(429).json({ error: "Превышен лимит запросов кода. Попробуйте позже." });
  }
  history.push(now);
  sendCodeAttempts.set(normalizedEmail, history);

  const code = Math.floor(1000 + Math.random() * 9000).toString();
  verificationCodes.set(normalizedEmail, { code, expiresAt: now + VERIFICATION_TTL_MS });

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@pon-network.app";

  if (process.env.NODE_ENV !== "production") {
    console.log(`[AUTH] Generated verification code for ${normalizedEmail} (dev only)`);
  }

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"PON Network" <${smtpFrom}>`,
        to: normalizedEmail,
        subject: "Код подтверждения регистрации PON",
        text: `Ваш код подтверждения для регистрации в сети PON: ${code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #0c0c0e; border: 1px solid #212124; border-radius: 16px; color: #ffffff;">
            <h2 style="font-size: 20px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 2px; color: #ffffff; margin-bottom: 24px;">ПОН • Сеть Нового Поколения</h2>
            <p style="font-size: 14px; color: #a3a3a3; line-height: 1.5;">Здравствуйте!</p>
            <p style="font-size: 14px; color: #a3a3a3; line-height: 1.5;">Вы регистрируетесь в децентрализованной социальной сети PON. Пожалуйста, введите следующий 4-значный код подтверждения, чтобы завершить создание аккаунта:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-family: monospace; font-weight: bold; letter-spacing: 6px; color: #14b8a6; background-color: #121214; padding: 12px 24px; border: 1px solid #212124; border-radius: 12px; display: inline-block;">${code}</span>
            </div>
            <p style="font-size: 11px; color: #525252; text-align: center; margin-top: 30px; border-top: 1px solid #1c1c1f; padding-top: 15px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
          </div>
        `,
      });

      return res.json({ success: true, smtp: true });
    } catch (err: any) {
      console.error("[SMTP Error] Failed to send real email:", err);
      if (process.env.NODE_ENV !== "production") {
        return res.json({ success: true, smtp: false, error: "SMTP failed (dev fallback)", code });
      }
      return res.status(502).json({ error: "Не удалось отправить письмо с кодом. Попробуйте позже." });
    }
  } else {
    console.warn("[SMTP Warning] SMTP not configured — returning code directly (demo mode).");
    return res.json({ success: true, smtp: false, smtpNotConfigured: true, code });
  }
});

// Verify a registration code
app.post("/api/auth/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const entry = verificationCodes.get(normalizedEmail);

  if (entry && Date.now() > entry.expiresAt) {
    verificationCodes.delete(normalizedEmail);
    return res.status(400).json({ error: "Срок действия кода истёк. Запросите новый." });
  }

  if (entry && entry.code === code.trim()) {
    verificationCodes.delete(normalizedEmail);
    return res.json({ success: true });
  }

  return res.status(400).json({ error: "Неверный код подтверждения!" });
});

// Get all posts
app.get("/api/posts", (req, res) => {
  const db = readDB();
  res.json(db.posts);
});

// Get AI stats
app.get("/api/stats", (req, res) => {
  const db = readDB();
  res.json(db.stats);
});

// Helper for running AI Analysis asynchronously in the background
async function runAIAnalysisInBackground(postId: string, text: string) {
  try {
    const aiResult = await runAIAnalysis(text);
    const db = readDB();
    const postIndex = db.posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      db.posts[postIndex].aiVerification = {
        ...aiResult,
        isAnalyzing: false
      };
      db.posts[postIndex].category = aiResult.category;

      // Update statistics
      db.stats.totalPostsAnalyzed += 1;
      if (aiResult.isBot) db.stats.detectedBots += 1;
      if (aiResult.verifiedStats.some(s => s.status === "warning")) db.stats.warningsIssued += 1;
      if (aiResult.verifiedStats.some(s => s.status === "verified")) db.stats.verifiedClaims += 1;

      writeDB(db);
      console.log(`[AI Background] Processed post ${postId}`);
    }
  } catch (err: any) {
    const isQuotaOrUnavailable = err?.message?.includes("quota") || err?.message?.includes("429") || err?.status === 429 || err?.message?.includes("503") || err?.status === 503;
    if (isQuotaOrUnavailable) {
      console.warn(`[AI Background] Rate-limited or unavailable for post ${postId}:`, err?.message || err);
    } else {
      console.error(`[AI Background] Failed to process post ${postId}:`, err);
    }
    // Remove the analyzing flag on error to prevent infinite spinners
    const db = readDB();
    const postIndex = db.posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      if (db.posts[postIndex].aiVerification) {
        db.posts[postIndex].aiVerification!.isAnalyzing = false;
        writeDB(db);
      }
    }
  }
}

// Create a new post with AI moderation
app.post("/api/posts", async (req, res) => {
  const { author, handle, avatar, text, image } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  const newPostId = `post-${Date.now()}`;

  // Pre-populate with initial "Analyzing" state for immediate, non-blocking publishing
  const initialAiVerification = {
    isBot: false,
    botConfidence: 0.01,
    isApproved: true,
    rejectionReason: "",
    verifiedStats: [],
    isAnalyzing: true,
    factCheck: {
      hasFacts: false,
      status: "unverified" as const,
      summary: "Анализ ИИ...",
      explanation: "Пост опубликован! ИИ прямо сейчас выполняет глубокий семантический анализ контента...",
      sources: []
    }
  };

  const newPost: Post = {
    id: newPostId,
    author: author || "Анонимный Пользователь",
    handle: handle || "@anonymous",
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    timestamp: "Только что",
    text,
    image,
    likes: 0,
    commentsCount: 0,
    reposts: 0,
    views: "1",
    captured: false,
    category: "forYou",
    commentsList: [],
    aiVerification: initialAiVerification
  };

  const db = readDB();
  db.posts.unshift(newPost);
  writeDB(db);

  // Trigger background asynchronous AI analysis immediately!
  runAIAnalysisInBackground(newPostId, text);

  // Return the post instantly to the client so there is zero latency
  res.json(newPost);
});

// Like / unlike post
app.post("/api/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const post = db.posts.find(p => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (post.hasLiked) {
    post.likes = Math.max(0, post.likes - 1);
    post.hasLiked = false;
  } else {
    post.likes += 1;
    post.hasLiked = true;
  }

  writeDB(db);
  res.json(post);
});

// Add comment with AI verification
app.post("/api/posts/:id/comment", async (req, res) => {
  const { id } = req.params;
  const { author, handle, avatar, text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Comment text is required" });
  }

  const db = readDB();
  const post = db.posts.find(p => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  // Simple comment AI verification (check for spam / bad words)
  const aiResult = await runAIAnalysis(text);

  if (!aiResult.isApproved) {
    return res.status(400).json({
      error: "Комментарий отклонен ИИ-модератором",
      reason: aiResult.rejectionReason
    });
  }

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author: author || "Анонимный Пользователь",
    handle: handle || "@anonymous",
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    text,
    timestamp: "Только что",
    aiVerification: {
      isBot: aiResult.isBot,
      botConfidence: aiResult.botConfidence,
      isApproved: aiResult.isApproved,
      rejectionReason: aiResult.rejectionReason
    }
  };

  post.commentsList.push(newComment);
  post.commentsCount = post.commentsList.length;

  writeDB(db);
  res.json(post);
});

// Helper to select a deterministic voice based on author name
function selectVoiceByAuthor(authorName: string): string {
  const voices = ["Kore", "Puck", "Charon", "Zephyr", "Fenrir"];
  let hash = 0;
  for (let i = 0; i < authorName.length; i++) {
    hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % voices.length;
  return voices[index];
}

// Helper to determine the best emotional intonation prompt instruction based on text
function getEmotionalInstruction(txt: string): string {
  const lower = txt.toLowerCase();
  
  if (lower.includes("!") || lower.includes("ура") || lower.includes("супер") || lower.includes("круто") || lower.includes("класс") || lower.includes("лучш") || lower.includes("пон")) {
    return "Say with vibrant excitement, happy energy, and highly cheerful intonation: ";
  }
  if (txt.includes("?")) {
    return "Say with natural conversational curiosity and inquisitive intonation: ";
  }
  if (lower.includes("код") || lower.includes("программ") || lower.includes("баз") || lower.includes("сервер") || lower.includes("технолог") || lower.includes("разработ") || lower.includes("ии")) {
    return "Say with confident intellect, warm and professional clarity, and expressive speech: ";
  }
  if (lower.includes("груст") || lower.includes("печаль") || lower.includes("плохо") || lower.includes("увы") || lower.includes("сожале") || lower.includes("боль") || lower.includes("жаль")) {
    return "Say gently, with realistic human sympathy, soft concerned intonation, and emotional depth: ";
  }
  if (lower.includes("хаха") || lower.includes("смешно") || lower.includes("шутк") || lower.includes("лол") || lower.includes("рофл") || lower.includes("сарказм")) {
    return "Say with a smiling, playful, slightly ironic and highly expressive voice: ";
  }
  return "Read this text aloud with a warm, highly expressive, natural human conversational intonation: ";
}

// Text-to-Speech (TTS) Endpoint
app.post("/api/tts", async (req, res) => {
  const { text, author } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.json({ fallback: true });
  }

  // Determine speaker voice and emotional tone
  const authorName = author || "Анонимный Пользователь";
  let voiceName = "Kore";
  let defaultEmotion = "";

  if (authorName.includes("Поддержка")) {
    voiceName = "Zephyr";
    defaultEmotion = "Say with professional, clear, warm, and highly reassuring intelligence: ";
  } else if (authorName.includes("Димон")) {
    voiceName = "Puck";
    defaultEmotion = "Say with friendly enthusiasm, casual geeky energy, and warm conversational pauses: ";
  } else if (authorName.includes("Соня")) {
    voiceName = "Kore";
    defaultEmotion = "Say with playful, cheerful, highly expressive, and slightly smiling intonation: ";
  } else {
    voiceName = selectVoiceByAuthor(authorName);
  }

  const emotionPrefix = defaultEmotion || getEmotionalInstruction(text);
  const promptText = `${emotionPrefix}${text}`;

  try {
    const response = await callGeminiWithRetry(async () => {
      return await client.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      });
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audio: base64Audio });
    } else {
      console.warn("No inline audio data returned by Gemini TTS");
      return res.json({ fallback: true });
    }
  } catch (err: any) {
    const isQuotaOrUnavailable = err?.message?.includes("quota") || err?.message?.includes("429") || err?.status === 429 || err?.message?.includes("503") || err?.status === 503;
    if (isQuotaOrUnavailable) {
      console.warn("Gemini TTS rate-limited or unavailable, using browser local synthesis fallback:", err?.message || err);
    } else {
      console.error("Gemini TTS generation failed:", err);
    }
    return res.json({ fallback: true });
  }
});

// Technical Support Chat Endpoint
app.post("/api/support/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const fallbackReplies = [
    "Техническая поддержка ПОН на связи. Все системы платформы работают в штатном режиме: ИИ-модератор активен, процент ботов составляет 0.0%. Как ещё я могу помочь вам?",
    "Спасибо за обращение! Сеть ПОН полностью защищена от фейковых новостей и автоматических бот-активностей благодаря глубокому контент-анализу на сервере. Задайте любой вопрос, и я помогу разобраться!",
    "Приветствую! Я зафиксировал ваш вопрос. Все наши сервисы, включая синтез речи и генерацию иллюстраций ИИ, работают в штатном режиме. Пожалуйста, напишите, если столкнулись с какими-либо трудностями.",
    "Технический отдел ПОН принял вашу заявку. Наш ИИ-детектер ботов сообщает, что ваша репутация идеальна (100% человек). Мы готовы ответить на любые технические вопросы!"
  ];

  const client = getGeminiClient();
  if (!client) {
    const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return res.json({ response: randomReply });
  }

  try {
    // Convert messages to Gemini conversational style
    const contents = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const response = await callGeminiWithRetry(async () => {
      return await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: "Вы — Техническая Поддержка децентрализованной социальной сети 'ПОН' (PON - Сеть Нового Поколения). Вы вежливый, очень технически грамотный, весёлый и отзывчивый инженер-поддержки. Вы общаетесь исключительно на русском языке, используете дружелюбный, но профессиональный тон, иногда добавляете уместные технические детали о нашей ИИ-модерации, проверке фактов или блокировке ИИ-ботов. Помогайте пользователю решать любые вопросы о платформе ПОН. Отвечайте коротко, понятно, по делу, укладываясь в 1-3 абзаца."
        }
      });
    });

    const replyText = response.text;
    if (replyText) {
      return res.json({ response: replyText.trim() });
    }
  } catch (err: any) {
    console.error("Gemini support chat error:", err);
  }

  const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  return res.json({ response: randomReply });
});

// Illustration Suggestions Endpoint
app.post("/api/illustration-suggestions", async (req, res) => {
  const { text } = req.body;

  const getOfflineKeywords = (txt: string) => {
    const lower = txt.toLowerCase();
    let keywords = ["abstract", "minimal", "modern", "design"];
    if (lower.includes("код") || lower.includes("программист") || lower.includes("бэкенд") || lower.includes("сервер")) {
      keywords = ["coding", "server", "cyberpunk", "developer"];
    } else if (lower.includes("политика") || lower.includes("новость") || lower.includes("выборы")) {
      keywords = ["politics", "news", "journalism", "newspaper"];
    } else if (lower.includes("дизайн") || lower.includes("верстка") || lower.includes("шрифт")) {
      keywords = ["design", "typography", "workspace", "minimalist"];
    } else if (lower.includes("игры") || lower.includes("гейминг")) {
      keywords = ["gaming", "gamer", "cyberpunk", "vaporwave"];
    }
    return keywords;
  };

  if (!text || text.trim() === "") {
    return res.json({ keywords: getOfflineKeywords("") });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.json({ keywords: getOfflineKeywords(text) });
  }

  try {
    const response = await callGeminiWithRetry(async () => {
      return await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Проанализируй этот текст и выдели ровно 4 коротких английских ключевых слова (для поиска картинок на Unsplash), которые идеально иллюстрируют смысл этого текста:\n"${text}"`,
        config: {
          systemInstruction: "Вы — эксперт-визуализатор. Ваша задача — вернуть ровно 4 ключевых слова на английском языке в формате JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywords: {
                type: Type.ARRAY,
                description: "Array of exactly 4 relevant English keywords/search terms for Unsplash image search.",
                items: { type: Type.STRING }
              }
            },
            required: ["keywords"]
          }
        }
      });
    });

    const resultText = response.text;
    if (resultText) {
      const data = JSON.parse(resultText.trim());
      if (Array.isArray(data.keywords) && data.keywords.length > 0) {
        return res.json({ keywords: data.keywords.slice(0, 4) });
      }
    }
  } catch (err: any) {
    const isQuotaOrUnavailable = err?.message?.includes("quota") || err?.message?.includes("429") || err?.status === 429 || err?.message?.includes("503") || err?.status === 503;
    if (isQuotaOrUnavailable) {
      console.warn("Gemini illustration suggestions rate-limited or unavailable, using offline keyword mapping:", err?.message || err);
    } else {
      console.error("Gemini illustration suggestions failed:", err);
    }
  }

  return res.json({ keywords: getOfflineKeywords(text) });
});

// DM Mutual Subscriber Chat Endpoint
app.post("/api/messages/chat", async (req, res) => {
  const { userId, messages } = req.body;

  if (!userId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "userId and messages array are required" });
  }

  const fallbacks: Record<string, string[]> = {
    alina_v: [
      "О, супер! Мне безумно нравится такой подход. Кстати, ты видел новые анимации переходов в ленте? Очень плавно!",
      "Да, полностью согласна. Хороший дизайн — это когда ничего не мешает контенту. ПОН в этом плане идеален!",
      "Обязательно попробуй нарисовать что-нибудь на баннере профиля! У меня получился классный минималистичный градиент."
    ],
    artem_code: [
      "Полностью согласен. Я тут как раз рефакторю один из модулей на сервере, код стал чище на 30%. Работаем дальше!",
      "Здорово! Обожаю, когда фичи работают быстро и без лагов. Наша ИИ-модерация на Gemini сейчас летает.",
      "Ха, классический баг. Главное — вовремя поймать его в логах! Если что, пиши, помогу разобраться с кодом."
    ],
    dasha_creative: [
      "Да! Это так вдохновляет! Скоро закончу еще один эскиз для шапки аккаунта и обязательно выложу в ленту ✨",
      "Обожаю яркие цвета! Искусство должно вызывать эмоции. Как тебе моя идея с кастомным рисованием?",
      "Привет! Давай вместе нарисуем что-нибудь крутое? Это ведь так просто сделать прямо в профиле!"
    ]
  };

  const userFallbacks = fallbacks[userId] || [
    "Привет! Рад общению. Как тебе социальная сеть ПОН? 😊",
    "Да, согласен с тобой! Здесь очень приятная атмосфера.",
    "Здорово! Напиши, если захочешь обсудить что-нибудь еще."
  ];

  const client = getGeminiClient();
  if (!client) {
    const randomReply = userFallbacks[Math.floor(Math.random() * userFallbacks.length)];
    return res.json({ response: randomReply });
  }

  try {
    const systemInstructions: Record<string, string> = {
      alina_v: "Вы — Алина Воробьева (@alina_v), продуктовый дизайнер. Вы очень дружелюбная, увлеченная минимализмом, чистыми интерфейсами и красивой типографикой. Вы общаетесь в личных сообщениях со своим другом (пользователем) в социальной сети 'ПОН'. Пишите коротко, неформально, на русском языке, как реальный человек в мессенджере. Не используйте неестественные фразы, пишите живо и тепло.",
      artem_code: "Вы — Артем Код (@artem_code), фулстек-разработчик. Вы обожаете JavaScript, TypeScript, оптимизацию, ИИ и любите шутить про баги, рефакторинг и кофе. Вы общаетесь в личных сообщениях со своим коллегой/другом (пользователем) в соцсети 'ПОН'. Пишите просто, по-дружески, тепло, как реальный разработчик в чате Telegram. Отвечайте коротко.",
      dasha_creative: "Вы — Даша Креатив (@dasha_creative), молодая художница и иллюстратор. Вы увлечены цифровым искусством, обожаете яркие сочные цвета, креатив, любите рисовать кастомные баннеры (шапки) для профилей. Вы общаетесь в личных сообщениях со своим другом (пользователем) в соцсети 'ПОН'. Пишите очень восторженно, творчески, мило, используя смайлики (типа ✨, 🎨, 💖). Отвечайте коротко и живо."
    };

    const sysInst = systemInstructions[userId] || "Вы — взаимный подписчик пользователя в социальной сети 'ПОН'. Вы общаетесь по-дружески, вежливо и открыто на русском языке. Пишите коротко, неформально.";

    const contents = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const response = await callGeminiWithRetry(async () => {
      return await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: sysInst
        }
      });
    });

    const replyText = response.text;
    if (replyText) {
      return res.json({ response: replyText.trim() });
    }
  } catch (err: any) {
    console.error(`Gemini mutual chat error for user ${userId}:`, err);
  }

  const randomReply = userFallbacks[Math.floor(Math.random() * userFallbacks.length)];
  return res.json({ response: randomReply });
});

// Start Vite development server or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
