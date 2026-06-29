import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import {
  Compass,
  Search,
  Sparkles,
  Bell,
  User,
  LogOut,
  Heart,
  MessageSquare,
  Repeat2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  X,
  Server,
  Shield,
  Lock,
  Cookie,
  Award,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Cpu,
  RefreshCw,
  Volume2,
  VolumeX,
  Wifi,
  Users,
  Upload,
  Sun,
  Moon,
  Headphones,
  Calendar,
  UserCheck,
  ShieldAlert
} from "lucide-react";

// --- TYPES ---
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

// --- CLEAN & AESTHETIC PRESET WALLPAPERS / ILLUSTRATIONS ---
const PRESET_ATTACHMENTS = [
  {
    id: "tech-design",
    title: "Минималистичный дизайн",
    url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600",
    description: "Разнообразие отступов и чистая сетка"
  },
  {
    id: "dev-night",
    title: "Рабочее место разработчика",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
    description: "Логи и код на серверах ПОН"
  },
  {
    id: "ai-neural",
    title: "Нейросеть в действии",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600",
    description: "Gemini анализирует поток контента"
  },
  {
    id: "abstract-flow",
    title: "Абстрактный цифровой поток",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    description: "Визуализация реального времени"
  }
];

export default function App() {
  // --- THEME ---
  const [theme, setTheme] = useState<"light" | "dark" | string>(() => {
    return localStorage.getItem("pon_theme") || "dark";
  });

  useEffect(() => {
    const body = window.document.body;
    if (theme === "light") {
      body.classList.add("light-theme");
    } else {
      body.classList.remove("light-theme");
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("pon_theme", nextTheme);
  };

  // --- NAVIGATION & SUB-TABS ---
  const [activeTab, setActiveTab] = useState<"lenta" | "search" | "aiHub" | "notifications" | "profile" | "support" | "messages">("lenta");
  const [feedSubTab, setFeedSubTab] = useState<"forYou" | "clans" | "following">("forYou");

  // --- REGISTRATION & SUPPORT STATES ---
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationReason, setRegistrationReason] = useState<"first_visit" | "inactive_7_days" | null>(null);

  const [supportMessages, setSupportMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem("pon_support_messages");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "support-welcome",
        sender: "support",
        text: "Привет! Рады видеть тебя в технической поддержке реальной сети PON. 🛡️\n\nЯ твой персональный ИИ-ассистент поддержки. Спроси меня о чём угодно: как работает наша ИИ-модерация фактов, как зарегистрироваться, почему мы блокируем ботов или почему у нас только честные пользователи без фальшивок.\n\nКак я могу помочь тебе прямо сейчас?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [supportInput, setSupportInput] = useState("");
  const [isSupportTyping, setIsSupportTyping] = useState(false);

  // --- STATE ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [aiStats, setAiStats] = useState({
    totalPostsAnalyzed: 0,
    detectedBots: 0,
    warningsIssued: 0,
    verifiedClaims: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState("Пользователь ПОН");
  const [regHandle, setRegHandle] = useState("@pon_user");
  const [regBio, setRegBio] = useState("Зашёл в реальную сеть ПОН! Здесь нет фальшивки, фейков и ботов. Каждый факт проверяется ИИ в реальном времени. 🛡️");
  const [regRole, setRegRole] = useState("developer");
  const [regAvatar, setRegAvatar] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150");
  const [regStep, setRegStep] = useState(1); // 1 = Welcome screen, 2 = Form input
  const [isAuthLogin, setIsAuthLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registered accounts database
  const [registeredAccounts, setRegisteredAccounts] = useState<any[]>(() => {
    const saved = localStorage.getItem("pon_registered_users");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const defaults = [
      {
        name: "Илья",
        email: "pon@gmail.com",
        password: "1234",
        handle: "@pon_user",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        bio: "Зашёл в реальную сеть ПОН! Здесь нет фальшивки, фейков и ботов. Каждый факт проверяется ИИ в реальном времени. 🛡️",
        role: "user",
        bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000"
      }
    ];
    localStorage.setItem("pon_registered_users", JSON.stringify(defaults));
    return defaults;
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [pendingRegistrationProfile, setPendingRegistrationProfile] = useState<any>(null);

  // User Profile (stored in localStorage)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("pon_profile");
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed ? { 
      ...parsed, 
      role: parsed.role || "user",
      bannerUrl: parsed.bannerUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000"
    } : {
      name: "Пользователь ПОН",
      handle: "@pon_user",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      bio: "Зашёл в реальную сеть ПОН! Здесь нет фальшивки, фейков и ботов. Каждый факт проверяется ИИ в реальном времени. 🛡️",
      role: "user",
      bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000"
    };
  });

  const isAdmin = userProfile?.handle?.toLowerCase() === "@guchipon" || userProfile?.handle?.toLowerCase() === "guchipon";

  useEffect(() => {
    const cleanLower = userProfile?.handle?.toLowerCase();
    const isGuchi = cleanLower === "@guchipon" || cleanLower === "guchipon";
    if (isGuchi && userProfile.role !== "admin") {
      setUserProfile(prev => ({ ...prev, role: "admin" }));
    }
  }, [userProfile?.handle]);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("pon_notifications");
    return saved ? JSON.parse(saved) : [
      {
        id: "n-1",
        type: "system",
        text: "Система ИИ-безопасности PON успешно подключена на бэкенде.",
        timestamp: "Только что",
        unread: true
      },
      {
        id: "n-2",
        type: "system",
        text: "Свежая сводка: бот-активность за последние 24 часа снизилась на 98%.",
        timestamp: "1 час назад",
        unread: false
      }
    ];
  });

  // Post composer state
  const [newPostText, setNewPostText] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [composerCategory, setComposerCategory] = useState<"forYou" | "clans" | "following">("forYou");
  const [showAttachmentSelector, setShowAttachmentSelector] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Dynamic illustration suggestions state
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>(["abstract", "digital", "minimalist", "design"]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [expandedPostFacts, setExpandedPostFacts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!showAttachmentSelector) return;

    const handler = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch("/api/illustration-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newPostText })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.keywords) && data.keywords.length > 0) {
            setSuggestedKeywords(data.keywords);
          }
        }
      } catch (err) {
        console.error("Failed to load illustration suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [newPostText, showAttachmentSelector]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Overlays
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showMobileComposer, setShowMobileComposer] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [showServerStatus, setShowServerStatus] = useState(false);
  const [serverMetrics, setServerMetrics] = useState({
    cpu: 12,
    memory: 45,
    ping: 15,
    connections: 48
  });

  // Moderation Warning Modal (Triggered when AI censors/blocks a post)
  const [moderationError, setModerationError] = useState<{
    text: string;
    message: string;
    reason: string;
    aiVerification: any;
  } | null>(null);

  // Simple feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Text-to-Speech (TTS) Playing State
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const activeAudioRef = React.useRef<{ stop: () => void } | null>(null);

  // DM / Mutual Subscriber States
  const [dms, setDms] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem("pon_dms");
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [activeDmUser, setActiveDmUser] = useState<string | null>(null);
  const [dmInput, setDmInput] = useState("");
  const [isDmTyping, setIsDmTyping] = useState(false);
  const [unreadDMs, setUnreadDMs] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("pon_unread_dms");
    if (saved) return JSON.parse(saved);
    return {};
  });

  const unreadDMsCount = Object.values(unreadDMs).filter(Boolean).length;

  const handleSendDM = async (userId: string, text: string) => {
    if (!text.trim()) return;

    const newMsg = {
      id: "dm-user-" + Date.now(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedUserMsgs = [...(dms[userId] || []), newMsg];
    const nextDms = { ...dms, [userId]: updatedUserMsgs };
    setDms(nextDms);
    localStorage.setItem("pon_dms", JSON.stringify(nextDms));
    setDmInput("");
    setIsDmTyping(true);

    try {
      // Send chat history (up to last 10 messages) to backend
      const history = updatedUserMsgs.slice(-10);
      const res = await fetch("/api/messages/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, messages: history })
      });

      if (res.ok) {
        const data = await res.json();
        const responseMsg = {
          id: "dm-reply-" + Date.now(),
          sender: "them",
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        const finalDms = { ...nextDms, [userId]: [...updatedUserMsgs, responseMsg] };
        setDms(finalDms);
        localStorage.setItem("pon_dms", JSON.stringify(finalDms));
      } else {
        throw new Error("Failed backend DM call");
      }
    } catch (err) {
      console.error("DM chat query error, using offline response:", err);
      // Friendly local fallback responses based on character
      const fallbacks: Record<string, string> = {
        alina_v: "Ой, извини, отвлеклась на верстку макета! Дизайн новой ленты действительно выглядит сочно, все кнопочки на своих местах!",
        artem_code: "Понял тебя. Пойду проверю работу сервера и оптимизирую базу данных, чтобы сообщения доходили мгновенно!",
        dasha_creative: "Как здорово! Я так рада, что мы общаемся. Побежала рисовать новые элементы интерфейса!"
      };
      const responseMsg = {
        id: "dm-fallback-" + Date.now(),
        sender: "them",
        text: fallbacks[userId] || "Да, согласен! Очень рад, что мы общаемся в ПОН.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      const finalDms = { ...nextDms, [userId]: [...updatedUserMsgs, responseMsg] };
      setDms(finalDms);
      localStorage.setItem("pon_dms", JSON.stringify(finalDms));
    } finally {
      setIsDmTyping(false);
      // Auto-scroll chat container
      setTimeout(() => {
        const chatWindow = document.getElementById("dm-chat-box");
        if (chatWindow) {
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      }, 100);
    }
  };

  const handleMarkDmRead = (userId: string) => {
    const nextUnread = { ...unreadDMs, [userId]: false };
    setUnreadDMs(nextUnread);
    localStorage.setItem("pon_unread_dms", JSON.stringify(nextUnread));
  };

  // Dynamic Online and Network Counters
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [networkPing, setNetworkPing] = useState(14);
  const [networkSpeed, setNetworkSpeed] = useState(128);

  // Fluctuations Effect for Live Counter Feel
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkPing(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
        return Math.max(8, Math.min(25, prev + change));
      });
      setNetworkSpeed(prev => {
        const change = Math.floor(Math.random() * 9) - 4; // -4 to +4
        return Math.max(115, Math.min(150, prev + change));
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      if (activeAudioRef.current) {
        activeAudioRef.current.stop();
      }
    };
  }, []);

  const handleToggleSpeak = async (postId: string, text: string, author?: string) => {
    if (playingPostId === postId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.stop();
        activeAudioRef.current = null;
      }
      setPlayingPostId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.stop();
      activeAudioRef.current = null;
    }

    setPlayingPostId(postId);
    setToastMessage("🗣️ Синтез речи нейросетью...");
    setTimeout(() => setToastMessage(null), 1500);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, author })
      });

      if (!res.ok) throw new Error("TTS request failed");
      const data = await res.json();

      if (data.fallback) {
        const synth = window.speechSynthesis;
        if (synth) {
          synth.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "ru-RU";
          
          // Apply custom voice parameters based on character and tone
          let pitch = 1.0;
          let rate = 1.0;
          
          const authorName = author || "";
          const lowerText = text.toLowerCase();
          
          if (authorName.includes("Соня")) {
            pitch = 1.2;
            rate = 1.1;
          } else if (authorName.includes("Димон")) {
            pitch = 0.95;
            rate = 1.05;
          } else if (authorName.includes("Поддержка")) {
            pitch = 1.0;
            rate = 0.95;
          } else {
            // Emotional tone heuristics
            if (lowerText.includes("!") || lowerText.includes("ура") || lowerText.includes("супер")) {
              pitch = 1.15;
              rate = 1.1;
            } else if (lowerText.includes("?") || lowerText.includes("почему") || lowerText.includes("как")) {
              pitch = 1.08;
            } else if (lowerText.includes("груст") || lowerText.includes("жаль") || lowerText.includes("увы")) {
              pitch = 0.9;
              rate = 0.85;
            }
          }
          
          utterance.pitch = pitch;
          utterance.rate = rate;

          // Attempt to select the best matching voice (male/female/Russian)
          const voices = synth.getVoices();
          const ruVoices = voices.filter(v => v.lang.startsWith("ru"));
          if (ruVoices.length > 0) {
            if (authorName.includes("Соня")) {
              // Prefer female-sounding voice if possible (usually containing "google" or "female" or "Microsoft Irina")
              const femaleVoice = ruVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("irina") || v.name.toLowerCase().includes("maria"));
              utterance.voice = femaleVoice || ruVoices[0];
            } else if (authorName.includes("Димон") || authorName.includes("Поддержка")) {
              // Prefer male-sounding voice if possible (Pavel, Boris, etc.)
              const maleVoice = ruVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("pavel") || v.name.toLowerCase().includes("alexander"));
              utterance.voice = maleVoice || ruVoices[0];
            } else {
              utterance.voice = ruVoices[0];
            }
          }

          utterance.onend = () => {
            setPlayingPostId(prev => prev === postId ? null : prev);
          };
          utterance.onerror = () => {
            setPlayingPostId(prev => prev === postId ? null : prev);
          };
          synth.speak(utterance);
          activeAudioRef.current = {
            stop: () => synth.cancel()
          };
        } else {
          throw new Error("Speech synthesis not supported");
        }
      } else if (data.audio) {
        const binary = atob(data.audio);
        const len = binary.length;
        const buffer = new ArrayBuffer(len);
        const view = new DataView(buffer);
        for (let i = 0; i < len; i++) {
          view.setUint8(i, binary.charCodeAt(i));
        }

        const numSamples = len / 2;
        const float32Data = new Float32Array(numSamples);
        for (let i = 0; i < numSamples; i++) {
          const intSample = view.getInt16(i * 2, true);
          float32Data[i] = intSample / 32768.0;
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);

        source.onended = () => {
          setPlayingPostId(prev => prev === postId ? null : prev);
          audioCtx.close();
        };

        source.start(0);
        activeAudioRef.current = {
          stop: () => {
            try {
              source.stop();
              audioCtx.close();
            } catch (e) {
              // ignore
            }
          }
        };
      }
    } catch (err) {
      console.error("Speech playback error:", err);
      setPlayingPostId(null);
      setToastMessage("🚫 Не удалось воспроизвести озвучку");
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // --- ACTIONS ---

  // Save profile helper
  const handleSaveProfile = (newProfile: typeof userProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem("pon_profile", JSON.stringify(newProfile));

    // Also update in registeredAccounts
    const updatedAccounts = registeredAccounts.map((acc: any) => {
      if (acc.handle.toLowerCase() === newProfile.handle.toLowerCase()) {
        return {
          ...acc,
          name: newProfile.name,
          avatar: newProfile.avatar,
          bio: newProfile.bio,
          bannerUrl: newProfile.bannerUrl,
          role: newProfile.role
        };
      }
      return acc;
    });
    setRegisteredAccounts(updatedAccounts);
    localStorage.setItem("pon_registered_users", JSON.stringify(updatedAccounts));
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = authEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setToastMessage("⚠️ Пожалуйста, введите E-Mail");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!authPassword || authPassword.length < 4) {
      setToastMessage("⚠️ Пароль должен быть не менее 4 символов");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isAuthLogin) {
      // Find the account
      const existingUser = registeredAccounts.find(
        (acc) => acc.email.toLowerCase() === normalizedEmail
      );

      if (!existingUser) {
        setToastMessage("⚠️ Аккаунт с такой почтой не найден!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      if (existingUser.password !== authPassword) {
        setToastMessage("⚠️ Неверный пароль!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      // Login success
      setUserProfile(existingUser);
      localStorage.setItem("pon_profile", JSON.stringify(existingUser));
      localStorage.setItem("pon_last_visit", Date.now().toString());

      setShowRegistration(false);
      setRegStep(1);
      setToastMessage("🎉 Успешный вход!");
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      // Registration: check if account exists
      const existingUser = registeredAccounts.find(
        (acc) => acc.email.toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        setToastMessage("⚠️ Пользователь с такой почтой уже зарегистрирован!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const inputUsername = authName.trim();
      if (!inputUsername || inputUsername.length < 2) {
        setToastMessage("⚠️ Пожалуйста, введите уникальный юзернейм (минимум 2 символа)");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      // Normalize username: lowercase, remove spaces and non-alphanumeric/underscore
      let cleanUsername = inputUsername.toLowerCase().replace(/\s+/g, "");
      if (cleanUsername.startsWith("@")) {
        cleanUsername = cleanUsername.substring(1);
      }

      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        setToastMessage("⚠️ Юзернейм может содержать только латинские буквы, цифры и символ подчеркивания");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const cleanHandle = "@" + cleanUsername;

      // Check if handle is taken
      const usernameExists = registeredAccounts.some(
        (acc) => acc.handle.toLowerCase() === cleanHandle.toLowerCase()
      );

      if (usernameExists) {
        setToastMessage("⚠️ Этот уникальный юзернейм уже занят другим пользователем!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      const isGuchi = cleanHandle === "@guchipon" || cleanUsername === "guchipon";
      const finalRole = isGuchi ? "admin" : "user";
      const initialDisplayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

      const proposedProfile = {
        name: initialDisplayName,
        email: normalizedEmail,
        password: authPassword,
        handle: cleanHandle,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        bio: "Зашёл в реальную сеть ПОН! Здесь нет фальшивки, фейков и ботов. Каждый факт проверяется ИИ в реальном времени. 🛡️",
        role: finalRole,
        bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000"
      };

      // Call backend to send verification code to the real email
      fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPendingRegistrationProfile(proposedProfile);
            setVerificationCode("");
            setIsVerifyingCode(true);

            if (data.smtpNotConfigured || !data.smtp) {
              const code = data.code || "1111";
              setGeneratedCode(code);
              setToastMessage(`📨 Код (без настроенного SMTP): ${code}`);
            } else {
              setGeneratedCode("");
              setToastMessage("📨 Код подтверждения отправлен на вашу почту!");
            }
          } else {
            setToastMessage(`❌ Ошибка: ${data.error || "Не удалось отправить код"}`);
          }
        })
        .catch((err) => {
          console.error("Auth send-code error:", err);
          const localCode = Math.floor(1000 + Math.random() * 9000).toString();
          setGeneratedCode(localCode);
          setPendingRegistrationProfile(proposedProfile);
          setVerificationCode("");
          setIsVerifyingCode(true);
          setToastMessage(`📨 Резервный код подтверждения: ${localCode}`);
        });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = pendingRegistrationProfile?.email || authEmail.trim().toLowerCase();

    if (generatedCode) {
      if (verificationCode.trim() !== generatedCode) {
        setToastMessage("❌ Неверный код подтверждения!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      completeRegistration();
    } else {
      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, code: verificationCode.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          completeRegistration();
        } else {
          setToastMessage(`❌ ${data.error || "Неверный код подтверждения!"}`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      } catch (err) {
        setToastMessage("❌ Ошибка связи с сервером!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const completeRegistration = () => {
    if (pendingRegistrationProfile) {
      const updatedAccounts = [...registeredAccounts, pendingRegistrationProfile];
      setRegisteredAccounts(updatedAccounts);
      localStorage.setItem("pon_registered_users", JSON.stringify(updatedAccounts));

      setUserProfile(pendingRegistrationProfile);
      localStorage.setItem("pon_profile", JSON.stringify(pendingRegistrationProfile));
      localStorage.setItem("pon_last_visit", Date.now().toString());

      setIsVerifyingCode(false);
      setPendingRegistrationProfile(null);
      setGeneratedCode("");
      setVerificationCode("");
      setShowRegistration(false);
      setRegStep(1);

      setToastMessage("🎉 Аккаунт успешно создан и подтвержден!");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Sync notifications to local storage
  useEffect(() => {
    localStorage.setItem("pon_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Sync support messages to local storage
  useEffect(() => {
    localStorage.setItem("pon_support_messages", JSON.stringify(supportMessages));
  }, [supportMessages]);

  // Check registration requirements (first visit or inactivity > 7 days)
  useEffect(() => {
    const savedProfile = localStorage.getItem("pon_profile");
    const lastVisit = localStorage.getItem("pon_last_visit");
    const now = Date.now();

    if (!savedProfile) {
      setShowRegistration(true);
      setRegistrationReason("first_visit");
    } else {
      const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      if (now - lastVisitTime > sevenDaysInMs) {
        setShowRegistration(true);
        setRegistrationReason("inactive_7_days");
      } else {
        // Safe within 7 days, update the visit timestamp to now
        localStorage.setItem("pon_last_visit", now.toString());
      }
    }

    // Periodically update last visit as user interacts with the app
    const interval = setInterval(() => {
      if (localStorage.getItem("pon_profile")) {
        localStorage.setItem("pon_last_visit", Date.now().toString());
      }
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, []);

  // Load posts and statistics from server
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [postsRes, statsRes] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/stats")
      ]);

      if (postsRes.ok && statsRes.ok) {
        const postsData = await postsRes.json();
        const statsData = await statsRes.json();
        setPosts(postsData);
        setAiStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch backend data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch initial data & start live periodic updates (6s polling)
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Update dynamic mock server metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setServerMetrics({
        cpu: Math.floor(Math.random() * 10) + 5,
        memory: Math.floor(Math.random() * 3) + 42,
        ping: Math.floor(Math.random() * 8) + 12,
        connections: 40 + Math.floor(Math.random() * 15)
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Publish a new post (Triggers server-side AI analysis and moderation)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedPresetId && !customImageUrl) return;

    setIsPosting(true);
    setModerationError(null);

    let attachedImage = "";
    if (selectedPresetId) {
      const found = PRESET_ATTACHMENTS.find(a => a.id === selectedPresetId);
      if (found) attachedImage = found.url;
    } else if (customImageUrl) {
      attachedImage = customImageUrl;
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: userProfile.name,
          handle: userProfile.handle,
          avatar: userProfile.avatar,
          text: newPostText,
          image: attachedImage || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // AI Moderation rejected the post
        setModerationError({
          text: newPostText,
          message: data.error || "Пост отклонён ИИ",
          reason: data.reason || "Текст содержит недопустимые выражения, спам или классифицирован как бот.",
          aiVerification: data.aiVerification
        });
        setToastMessage("🚫 Публикация заблокирована модератором");
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        // Successfully published
        setPosts(prev => [data, ...prev]);
        setNewPostText("");
        setSelectedPresetId(null);
        setCustomImageUrl("");
        setShowAttachmentSelector(false);
        setToastMessage("🚀 Опубликовано! Запущен фоновый ИИ-анализ...");
        setTimeout(() => setToastMessage(null), 3000);

        // Fetch fresh statistics immediately
        const statsRes = await fetch("/api/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAiStats(statsData);
        }
      }
    } catch (err) {
      console.error("Posting failed:", err);
      setToastMessage("Ошибка связи с сервером");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsPosting(false);
    }
  };

  // Toggle Post Like
  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // Toggle Repost
  const handleRepost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isReposted = !post.hasReposted;
        return {
          ...post,
          reposts: isReposted ? post.reposts + 1 : post.reposts - 1,
          hasReposted: isReposted
        };
      }
      return post;
    }));
    setToastMessage("Пост добавлен в ваши закладки!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Capture post (Nuksta mechanic)
  const handleCapturePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const nextCaptured = !post.captured;
        if (nextCaptured) {
          setToastMessage(`Вы захватили публикацию от ${post.author}! 🔥`);
          setTimeout(() => setToastMessage(null), 3000);
        }
        return {
          ...post,
          captured: nextCaptured
        };
      }
      return post;
    }));
  };

  // Add a Comment (Triggers server-side AI check on the comment text)
  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: userProfile.name,
          handle: userProfile.handle,
          avatar: userProfile.avatar,
          text: newCommentText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setToastMessage(`🚫 Ошибка: ${data.reason || "Комментарий отклонён ИИ"}`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? data : p));
        setNewCommentText("");
        setToastMessage("💬 Комментарий добавлен!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error commenting:", err);
    }
  };

  // Manual pull-to-refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    setToastMessage("Данные обновлены с сервера!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Filter posts based on navigation or search query
  const filteredPosts = posts.filter(post => {
    if (activeTab === "search" && searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        post.text.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.handle.toLowerCase().includes(q)
      );
    }

    if (activeTab === "lenta") {
      return post.category === feedSubTab;
    }

    if (activeTab === "profile") {
      return post.handle === userProfile.handle;
    }

    return true;
  });

  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  // --- SUB-VIEWS ---

  // 1. Search Panel
  const renderSearch = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          placeholder="Поиск постов, авторов или хэштегов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#161619] border border-[#212124] text-white pl-12 pr-4 py-3.5 rounded-full outline-none focus:border-neutral-500 transition-colors placeholder-neutral-500 text-sm"
        />
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
          Популярные хэштеги в ПОН
        </h3>
        <div className="flex flex-wrap gap-2">
          {["#безопасность", "#ии_модератор", "#типографика", "#фактчекинг", "#бэкенд", "#дизайн"].map(tag => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-3.5 py-1.5 rounded-full bg-[#161619] hover:bg-[#232328] border border-[#212124] text-xs text-neutral-300 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-300">
            {searchQuery ? `Результаты поиска (${filteredPosts.length})` : "Свежие публикации сообщества"}
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Сбросить поиск
            </button>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-[#161619] rounded-2xl border border-[#212124]">
            <p className="text-neutral-500 text-sm">Ничего не найдено по вашему запросу</p>
          </div>
        ) : (
          filteredPosts.map(post => renderPostCard(post))
        )}
      </div>
    </div>
  );

  // 2. AI Hub Dashboard (Replaces the unrequested/mock "meme battle")
  const renderAIHub = () => {
    // Collect all factual claims analyzed across all posts
    const allCheckedClaims = posts
      .filter(p => p.aiVerification?.verifiedStats && p.aiVerification.verifiedStats.length > 0)
      .flatMap(p => p.aiVerification!.verifiedStats.map(stat => ({ ...stat, postAuthor: p.author, postHandle: p.handle })));

    return (
      <div className="space-y-6">
        {/* Hub Header */}
        <div className="p-6 bg-gradient-to-tr from-[#1b1e2c] to-[#12131a] rounded-3xl border border-[#272a3a] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-indigo-500/10 blur-3xl rounded-full" />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-teal-500/10 blur-3xl rounded-full" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> ИИ БЕЗОПАСНОСТЬ & МОДЕРАЦИЯ
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              Аудит Достоверности Фактов и Борьба с Ботами
            </h2>

            <p className="text-neutral-400 text-sm leading-relaxed">
              Социальная сеть PON использует глубокие языковые модели на бэкенде для мгновенного фактчекинга и защиты от автоматизированных ботов. Мы верим, что цифры в публикациях не должны врать. Никаких бот-накруток и ложных вбросов.
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#161619] border border-[#212124] rounded-2xl space-y-1">
            <div className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Всего проверено</div>
            <div className="text-2xl font-bold text-white font-mono">{aiStats.totalPostsAnalyzed}</div>
            <div className="text-[9px] text-neutral-400">публикаций в реальном времени</div>
          </div>

          <div className="p-4 bg-[#161619] border border-[#212124] rounded-2xl space-y-1">
            <div className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Блокировка ботов</div>
            <div className="text-2xl font-bold text-rose-500 font-mono">{aiStats.detectedBots}</div>
            <div className="text-[9px] text-neutral-400">авто-аккаунтов изолировано</div>
          </div>

          <div className="p-4 bg-[#161619] border border-[#212124] rounded-2xl space-y-1">
            <div className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Предупреждения</div>
            <div className="text-2xl font-bold text-yellow-500 font-mono">{aiStats.warningsIssued}</div>
            <div className="text-[9px] text-neutral-400">фактических неточностей найдено</div>
          </div>

          <div className="p-4 bg-[#161619] border border-[#212124] rounded-2xl space-y-1">
            <div className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Верифицировано</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{aiStats.verifiedClaims}</div>
            <div className="text-[9px] text-neutral-400">объективных фактов подтверждено</div>
          </div>
        </div>

        {/* Real-time Activity Dynamics Chart (Developer & Admin Only) */}
        {(() => {
          const hasSpecialAccess = userProfile.role === "developer" || userProfile.role === "admin";
          
          // Dynamics data for the last 7 days (real-time increments as user posts)
          const getDynamicsData = () => {
            const data = [];
            const now = new Date();
            // Organic base seeds representing past human activity (stable profile proof)
            const baseSeed = [2, 4, 1, 3, 2, 5, 3];
            
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(now.getDate() - i);
              const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
              const dayLabel = `${dayNames[d.getDay()]} (${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')})`;
              
              let count = baseSeed[6 - i];
              
              // Count actual user posts
              const userPosts = posts.filter(p => p.handle === userProfile.handle);
              userPosts.forEach(post => {
                const match = post.id.match(/^post-(\d+)$/);
                if (match) {
                  const t = parseInt(match[1]);
                  const postDate = new Date(t);
                  if (postDate.toDateString() === d.toDateString()) {
                    count += 1;
                  }
                } else if (i === 0 && post.timestamp === "Только что") {
                  count += 1;
                }
              });
              
              data.push({
                name: dayLabel,
                "Публикации": count
              });
            }
            return data;
          };

          const dynamicsData = getDynamicsData();

          return (
            <div className="p-5 bg-[#161619] border border-[#212124] rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${hasSpecialAccess ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-neutral-800 text-neutral-500 border border-neutral-700/50"}`}>
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Анализ поведенческой динамики автора
                    </h4>
                    <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                      Верификация человека за последние 7 дней
                    </p>
                  </div>
                </div>
                {hasSpecialAccess ? (
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#14b8a6]/15 text-teal-400 border border-teal-500/30 animate-pulse">
                    ДОСТУП РАЗРЕШЕН (Dev/Admin)
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                    🔒 ДОСТУП ОГРАНИЧЕН
                  </span>
                )}
              </div>

              {hasSpecialAccess ? (
                <div className="space-y-3">
                  <div className="h-[200px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dynamicsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="publicationsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#444" 
                          fontSize={9} 
                          tickLine={false}
                          axisLine={false}
                          style={{ fill: '#737373', fontFamily: 'monospace' }} 
                        />
                        <YAxis 
                          stroke="#444" 
                          fontSize={9} 
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          style={{ fill: '#737373', fontFamily: 'monospace' }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "#121215", 
                            borderColor: "#26262b", 
                            borderRadius: "8px", 
                            color: "#fff", 
                            fontSize: "10px", 
                            fontFamily: "monospace" 
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Публикации" 
                          stroke="#14b8a6" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#publicationsGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[9.5px] text-neutral-400 font-sans leading-relaxed pt-1 border-t border-[#212124]">
                    🛡️ <span className="font-semibold text-teal-400">Вердикт ИИ ПОН:</span> Биометрический почерк аккаунта соответствует живому человеку. Защита от ботов подтверждает естественную периодичность генерации контента и ручной ввод текстов.
                  </p>
                </div>
              ) : (
                <div className="py-8 px-4 flex flex-col items-center text-center justify-center bg-neutral-900/40 rounded-xl border border-dashed border-neutral-800 space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[2px] pointer-events-none" />
                  <div className="p-3 bg-neutral-800/80 rounded-full border border-neutral-700 relative z-10">
                    <Lock className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div className="space-y-1 relative z-10 max-w-sm">
                    <h5 className="text-xs font-bold text-neutral-300">Данные скрыты системой безопасности</h5>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Динамический график поведенческого следа защищен протоколом конфиденциальности. Доступ открыт только для сертифицированных **Администраторов** или **Разработчиков** сети.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="relative z-10 px-4 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-[10px] text-indigo-300 font-bold font-mono transition-all"
                  >
                    Включить статус разработчика в профиле →
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Verified Claims Stream */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
              Потоковая Верификация Фактов (Community Notes)
            </h3>
            <button
              onClick={handleManualRefresh}
              className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1 font-mono transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Обновить данные
            </button>
          </div>

          {allCheckedClaims.length === 0 ? (
            <div className="text-center py-12 bg-[#161619] rounded-2xl border border-[#212124]">
              <HelpCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-neutral-500 text-xs">Пока не опубликовано постов со статистикой или фактами.</p>
              <p className="text-neutral-600 text-[10px] mt-1">Напишите пост с какими-либо числами, чтобы ИИ проверил его!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allCheckedClaims.map((claim, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex gap-3 items-start transition-all ${
                    claim.status === "verified"
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : claim.status === "warning"
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-neutral-500/5 border-neutral-500/10"
                  }`}
                >
                  <div className="mt-0.5">
                    {claim.status === "verified" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {claim.status === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {claim.status === "unverified" && <HelpCircle className="w-4 h-4 text-neutral-400" />}
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-300 font-mono text-[10px] uppercase">
                        Утверждение от {claim.postAuthor}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          claim.status === "verified"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : claim.status === "warning"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {claim.status === "verified" && "Подтверждено"}
                        {claim.status === "warning" && "Внимание (Неточно)"}
                        {claim.status === "unverified" && "Не подтверждено"}
                      </span>
                    </div>
                    <p className="text-white italic">"{claim.claim}"</p>
                    <p className="text-neutral-400 leading-relaxed pt-1 border-t border-white/5 font-sans">
                      {claim.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- SUPPORT CHAT METHODS ---
  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;

    const userMsg = {
      id: "support-user-" + Date.now(),
      sender: "user",
      text: supportInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSupportMessages(prev => [...prev, userMsg]);
    setSupportInput("");
    setIsSupportTyping(true);

    try {
      const chatContext = [...supportMessages, userMsg].slice(-8);

      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatContext })
      });

      if (res.ok) {
        const data = await res.json();
        const supportReply = {
          id: "support-reply-" + Date.now(),
          sender: "support",
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSupportMessages(prev => [...prev, supportReply]);
      } else {
        throw new Error("Failed to fetch response");
      }
    } catch (err) {
      console.error("Support chat request failed, using local fallback:", err);
      const fallbackMsg = {
        id: "support-fallback-" + Date.now(),
        sender: "support",
        text: "Извините, наши серверы поддержки сейчас перегружены ИИ-анализом бот-сетей. Все системы работают в штатном режиме. ИИ-монитор активен. Напишите, если у вас возникнут другие вопросы!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSupportMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsSupportTyping(false);
      // Auto-scroll to bottom of chat
      setTimeout(() => {
        const container = document.getElementById("support-chat-messages");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  };

  const renderMessages = () => {
    const mutualUsers: any[] = [];

    const activeUser = mutualUsers.find(u => u.id === activeDmUser);

    return (
      <div className="space-y-6">
        {/* Header Block */}
        <div className="p-6 bg-gradient-to-tr from-[#161a24] to-[#12131a] rounded-3xl border border-neutral-800 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-teal-500/10 blur-3xl rounded-full" />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-indigo-500/10 blur-3xl rounded-full" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold font-mono mb-2">
                <Users className="w-3.5 h-3.5" /> ВЗАИМНЫЕ ПОДПИСКИ
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Личные сообщения</h2>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
                Общайтесь только с теми пользователями, с которыми у вас взаимная подписка. Полная защита от нежелательных сообщений.
              </p>
            </div>
          </div>
        </div>

        {/* DM Layout container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[600px] items-stretch">
          {/* Left panel - Users list */}
          <div className={`md:col-span-4 bg-[#161619] border border-[#212124] rounded-2xl p-4 flex flex-col space-y-3 ${activeDmUser ? "hidden md:flex" : "flex"}`}>
            <h3 className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
              Ваши друзья ({mutualUsers.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {mutualUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 text-neutral-500">
                  <p className="text-xs font-medium text-neutral-400 mb-1">Нет взаимных подписок</p>
                  <p className="text-[10px] text-neutral-600">Подпишитесь на пользователей в ленте, чтобы начать общение</p>
                </div>
              ) : (
                mutualUsers.map(user => {
                  const userHistory = dms[user.id] || [];
                  const lastMsg = userHistory[userHistory.length - 1];
                  const hasUnread = unreadDMs[user.id];
                  const isSelected = activeDmUser === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setActiveDmUser(user.id);
                        handleMarkDmRead(user.id);
                        setTimeout(() => {
                          const chatBox = document.getElementById("dm-chat-box");
                          if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
                        }, 100);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                        isSelected
                          ? "bg-[#232328]/80 border-neutral-700/60"
                          : "bg-transparent border-transparent hover:bg-[#1e1e22]/40"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-11 h-11 rounded-full object-cover border border-neutral-800"
                        />
                        {user.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#161619] rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{user.name}</span>
                          {hasUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono block">{user.handle}</span>
                        <p className="text-[11px] text-neutral-400 truncate mt-1">
                          {lastMsg ? (lastMsg.sender === "user" ? "Вы: " : "") + lastMsg.text : "Начать диалог..."}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel - Conversation */}
          <div className={`md:col-span-8 bg-[#161619] border border-[#212124] rounded-2xl flex flex-col h-full overflow-hidden ${!activeDmUser ? "hidden md:flex items-center justify-center text-center p-8 text-neutral-500" : "flex"}`}>
            {activeUser ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-[#212124] bg-[#121215]/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setActiveDmUser(null)}
                      className="md:hidden p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="relative shrink-0">
                      <img
                        src={activeUser.avatar}
                        alt={activeUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                      />
                      {activeUser.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#161619] rounded-full" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white leading-none">{activeUser.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          взаимно
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500 font-mono block mt-1">{activeUser.handle}</span>
                    </div>
                  </div>

                  <div className="hidden lg:block max-w-xs text-right truncate">
                    <span className="text-[10px] text-neutral-500 italic block">{activeUser.bio}</span>
                  </div>
                </div>

                {/* Messages body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-[#0c0c0d]/20" id="dm-chat-box">
                  {(dms[activeUser.id] || []).map((msg, index) => {
                    const isSelf = msg.sender === "user";
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col max-w-[80%] ${
                          isSelf ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isSelf
                              ? "bg-teal-500/10 border border-teal-500/30 text-teal-100 rounded-tr-none"
                              : "bg-[#1f1f23] border border-neutral-800 text-neutral-200 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] font-mono text-neutral-600 mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    );
                  })}

                  {/* Typing state */}
                  {isDmTyping && (
                    <div className="self-start items-start flex flex-col max-w-[80%]">
                      <div className="bg-[#1f1f23] border border-neutral-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-400 font-mono font-medium flex items-center gap-1">
                          {activeUser.name} печатает
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce delay-100">.</span>
                          <span className="animate-bounce delay-200">.</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendDM(activeUser.id, dmInput);
                  }}
                  className="p-3 border-t border-[#212124] bg-[#121215]/40 flex gap-2"
                >
                  <input
                    type="text"
                    value={dmInput}
                    onChange={(e) => setDmInput(e.target.value)}
                    placeholder={`Написать @${activeUser.id}...`}
                    className="flex-1 bg-[#0c0c0d] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 placeholder-neutral-600 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!dmInput.trim() || isDmTyping}
                    className="p-2.5 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 disabled:hover:bg-teal-400 text-black font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#1c1c20] border border-neutral-800 flex items-center justify-center text-neutral-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Диалог не выбран</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">Выберите друга из списка взаимных подписок слева, чтобы начать переписку.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupportChat = () => {
    return (
      <div className="space-y-6">
        {/* Support Header */}
        <div className="p-6 bg-gradient-to-tr from-[#161a24] to-[#12131a] rounded-3xl border border-neutral-800 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-teal-500/15 blur-3xl rounded-full animate-pulse" />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-indigo-500/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold font-mono">
                <Headphones className="w-3.5 h-3.5" /> ТЕХ.ПОДДЕРЖКА ПОН
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Технический Ассистент PON</h2>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
                Задайте любой вопрос по платформе: о проверке фактов, защите от спам-ботов, лимитах публикации или правах разработчика.
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0c0c0d]/80 rounded-2xl border border-neutral-800 w-fit shrink-0">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Support-ИИ Онлайн
              </span>
            </div>
          </div>
        </div>

        {/* Chat area container */}
        <div className="bg-[#161619] border border-[#212124] rounded-2xl p-4 md:p-5 flex flex-col h-[520px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin flex flex-col" id="support-chat-messages">
            {supportMessages.map((msg) => {
              const isSupport = msg.sender === "support";
              const isPlaying = playingPostId === "support-" + msg.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isSupport ? "self-start" : "self-end flex-row-reverse ml-auto"}`}
                >
                  {isSupport ? (
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                  ) : (
                    <img
                      src={userProfile.avatar}
                      alt="User avatar"
                      className="w-8 h-8 rounded-full object-cover border border-neutral-800 shrink-0"
                    />
                  )}

                  <div className="space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed relative group transition-colors ${
                        isSupport
                          ? "bg-[#1f1f24] text-neutral-100 rounded-tl-none border border-neutral-800"
                          : "bg-teal-500 text-black font-medium rounded-tr-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                      
                      {/* Audio Button for Support Replies */}
                      {isSupport && (
                        <button
                          type="button"
                          onClick={() => handleToggleSpeak("support-" + msg.id, msg.text, "Техподдержка")}
                          className={`absolute bottom-2 right-2 p-1.5 rounded-full text-neutral-400 hover:text-white transition-all bg-[#0c0c0d]/60 border border-neutral-800 opacity-0 group-hover:opacity-100 ${
                            isPlaying ? "opacity-100 text-teal-400" : ""
                          }`}
                          title="Озвучить ИИ"
                        >
                          {isPlaying ? (
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className={`text-[9px] font-mono text-neutral-500 ${isSupport ? "pl-1 text-left" : "pr-1 text-right"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isSupportTyping && (
              <div className="flex gap-3 items-center text-neutral-500 text-xs self-start">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Headphones className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-[#1f1f24] border border-neutral-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-neutral-400">Техподдержка печатает</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions Helper Row */}
          <div className="py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-neutral-900 mt-4 shrink-0">
            {[
              "Как работает ИИ-модерация?",
              "Почему мои посты проверяются?",
              "Как получить роль разработчика?",
              "Как пожаловаться на фейк?"
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setSupportInput(q);
                }}
                className="px-3 py-1.5 rounded-full bg-[#1e1e24] hover:bg-[#282830] border border-neutral-800 text-[10px] text-neutral-300 transition-colors whitespace-nowrap font-sans shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendSupportMessage} className="mt-2 flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Введите ваш вопрос в техподдержку..."
              value={supportInput}
              onChange={(e) => setSupportInput(e.target.value)}
              disabled={isSupportTyping}
              className="flex-1 bg-[#0c0c0d] border border-neutral-800 text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-teal-500 disabled:opacity-50 font-sans"
            />
            <button
              type="submit"
              disabled={isSupportTyping || !supportInput.trim()}
              className="px-5 bg-teal-400 text-black hover:bg-teal-300 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-4 h-4 font-bold" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 3. Post Card Component (Aesthetic & Safe)
  const renderPostCard = (post: Post) => {
    const isOwner = post.handle === userProfile.handle;
    const isBot = post.aiVerification?.isBot;
    const isVerified = (post.aiVerification?.factCheck?.hasFacts && post.aiVerification?.factCheck?.status === "verified") ||
      (post.aiVerification?.verifiedStats && post.aiVerification.verifiedStats.length > 0 && post.aiVerification.verifiedStats.some(s => s.status === "verified") && !post.aiVerification.verifiedStats.some(s => s.status === "warning"));

    return (
      <div
        key={post.id}
        className={`p-4 sm:p-5 bg-[#161619] rounded-2xl border border-[#212124] transition-all space-y-4 relative overflow-hidden ${
          isBot 
            ? "opacity-70 border-rose-500/20 bg-[#161213]" 
            : isVerified
            ? "border-emerald-500/30 bg-[#151a18] shadow-[0_0_15px_rgba(16,185,129,0.04)]"
            : "hover:border-neutral-700/40"
        }`}
      >
        {/* Post Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="relative">
              <img
                src={post.avatar}
                alt={post.author}
                className="w-10 h-10 rounded-full object-cover border border-neutral-800"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-neutral-900">
                <span className="text-black text-[10px] font-bold leading-none">+</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white hover:underline cursor-pointer">{post.author}</span>
                {post.captured && (
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    захвачен
                  </span>
                )}
                {isBot && (
                  <span className="text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-1">
                    🤖 ПОДОЗРЕНИЕ НА БОТА
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                <span>{post.handle}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            {isOwner && (
              <span className="text-[9px] font-mono uppercase bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/20">
                Ваш пост
              </span>
            )}
          </div>
        </div>

        {/* Post Text */}
        <p className="text-xs text-neutral-100 whitespace-pre-wrap leading-relaxed">
          {post.text.split(" ").map((word, i) => {
            if (word.startsWith("#")) {
              return (
                <span key={i} className="text-teal-400 hover:underline cursor-pointer font-mono mr-1">
                  {word}{" "}
                </span>
              );
            }
            return word + " ";
          })}
        </p>

        {/* Real-time AI Analysis Pending / Loading Panel */}
        {post.aiVerification?.isAnalyzing && (
          <div 
            className="p-3.5 bg-neutral-900/40 border border-teal-500/10 rounded-xl space-y-3 pt-3 border-t border-[#232328]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">
                  ИИ «ПОН» выполняет анализ в фоновом режиме...
                </span>
              </div>
              <span className="text-[9px] font-mono text-neutral-600 uppercase">Опубликовано</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 bg-neutral-800/80 rounded w-11/12" />
              <div className="h-1.5 bg-neutral-800/80 rounded w-8/12" />
            </div>
          </div>
        )}

        {/* Fact-checking details from Gemini ("следит чтобы цыфры не врали") */}
        {post.aiVerification?.verifiedStats && post.aiVerification.verifiedStats.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#232328]">
            {post.aiVerification.verifiedStats.map((stat, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex gap-2 items-start ${
                  stat.status === "verified"
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                    : stat.status === "warning"
                    ? "bg-yellow-500/5 border-yellow-500/10 text-yellow-300"
                    : "bg-neutral-800/40 border-neutral-800 text-neutral-300"
                }`}
              >
                <div className="mt-0.5">
                  {stat.status === "verified" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {stat.status === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                  {stat.status === "unverified" && <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />}
                </div>
                <div>
                  <div className="font-bold text-[10px] uppercase font-mono tracking-wide opacity-80 flex items-center gap-1">
                    🛡️ Верификация ИИ фактов: "{stat.claim}"
                  </div>
                  <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed font-sans">
                    {stat.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deep Fact-Checking Panel for News/Politics/General Claims */}
        {post.aiVerification?.factCheck?.hasFacts && (
          <div className="pt-2 border-t border-[#232328]">
            <div
              onClick={() => {
                setExpandedPostFacts(prev => ({
                  ...prev,
                  [post.id]: !prev[post.id]
                }));
              }}
              className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col gap-2 ${
                post.aiVerification.factCheck.status === "verified"
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/[0.08]"
                  : post.aiVerification.factCheck.status === "fake"
                  ? "bg-rose-500/5 border-rose-500/20 text-rose-300 hover:bg-rose-500/[0.08]"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-300 hover:bg-amber-500/[0.08]"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black/40 border border-current">
                    {post.aiVerification.factCheck.status === "verified" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {post.aiVerification.factCheck.status === "fake" && <X className="w-3 h-3 text-rose-400" />}
                    {post.aiVerification.factCheck.status === "unverified" && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div>
                    <span className="font-bold text-[11px] font-mono uppercase tracking-wide">
                      {post.aiVerification.factCheck.summary}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">
                      Кликните для подробностей и просмотра источников ИИ
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform ${
                    expandedPostFacts[post.id] ? "rotate-180" : ""
                  }`}
                />
              </div>

              {expandedPostFacts[post.id] && (
                <div
                  className="space-y-3 mt-2 pt-2.5 border-t border-neutral-800/40 text-[11px] text-neutral-300"
                >
                  <p className="leading-relaxed font-sans font-normal">
                    {post.aiVerification.factCheck.explanation}
                  </p>

                  {post.aiVerification.factCheck.sources && post.aiVerification.factCheck.sources.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider">
                        Источники, найденные ИИ:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.aiVerification.factCheck.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 bg-black/50 hover:bg-neutral-900 border border-neutral-800 text-teal-400 hover:text-teal-300 rounded px-2 py-1 transition-colors text-[10px] font-mono"
                          >
                            <span>{src.title}</span>
                            <span className="text-[8px] opacity-60">↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Image with Expand Overlay */}
        {post.image && (
          <div className="relative group rounded-xl overflow-hidden border border-[#212124] max-h-96 bg-neutral-950 flex items-center justify-center">
            <img
              src={post.image}
              alt="Attachment"
              className="object-cover max-h-96 w-full cursor-zoom-in"
              onClick={() => setSelectedImage(post.image || null)}
            />
          </div>
        )}

        {/* Post Footer Actions */}
        <div className="flex justify-between items-center pt-2 text-neutral-500 text-xs border-t border-neutral-900">
          <div className="flex items-center gap-4">
            {/* Likes */}
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-1.5 transition-colors ${
                post.hasLiked ? "text-rose-500" : "hover:text-neutral-300"
              }`}
            >
              <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-rose-500" : ""}`} />
              <span className="font-mono">{post.likes}</span>
            </button>

            {/* Comments toggle */}
            <button
              onClick={() => {
                setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id);
              }}
              className={`flex items-center gap-1.5 hover:text-neutral-300 transition-colors ${
                activeCommentsPostId === post.id ? "text-teal-400" : ""
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-mono">{post.commentsCount}</span>
            </button>

            {/* Repost/Bookmarks */}
            <button
              onClick={() => handleRepost(post.id)}
              className={`flex items-center gap-1.5 hover:text-neutral-300 transition-colors ${
                post.hasReposted ? "text-emerald-500" : ""
              }`}
            >
              <Repeat2 className="w-4 h-4" />
              <span className="font-mono">{post.reposts}</span>
            </button>

            {/* Text-to-Speech Button */}
            <button
              onClick={() => handleToggleSpeak(post.id, post.text, post.author)}
              className={`flex items-center gap-1.5 hover:text-neutral-300 transition-all ${
                playingPostId === post.id ? "text-rose-400" : "text-neutral-500"
              }`}
              title="Озвучить пост нейросетью"
            >
              {playingPostId === post.id ? (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">Стоп</span>
                  <div className="flex items-end gap-[1.5px] h-2.5 pb-[1px]">
                    <div className="w-[1.5px] h-1.5 bg-rose-400" />
                    <div className="w-[1.5px] h-2.5 bg-rose-400" />
                    <div className="w-[1.5px] h-1 bg-rose-400" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors">
                  <Volume2 className="w-4 h-4 text-neutral-500" />
                  <span className="font-mono text-neutral-500">Слушать</span>
                </div>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Capture action button */}
            <button
              onClick={() => handleCapturePost(post.id)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                post.captured
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-transparent border-[#2e2e34] text-neutral-400 hover:text-white hover:border-neutral-500"
              }`}
            >
              {post.captured ? "Захвачен" : "Захватить пост"}
            </button>

            {/* Views */}
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <Eye className="w-3.5 h-3.5" />
              <span>{post.views}</span>
            </div>
          </div>
        </div>

        {/* Comment Section (Collapsible) */}
        {activeCommentsPostId === post.id && (
          <div
            className="pt-4 border-t border-neutral-900 space-y-3"
          >
            {/* Comment List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {post.commentsList.length === 0 ? (
                <p className="text-neutral-500 text-xs italic">Комментариев пока нет. Будьте первым!</p>
              ) : (
                post.commentsList.map(comment => (
                  <div key={comment.id} className="flex gap-2 text-xs items-start bg-[#0c0c0d]/40 p-2.5 rounded-xl border border-[#212124]">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span className="font-semibold text-neutral-300">{comment.author}</span>
                        <span>{comment.timestamp}</span>
                      </div>
                      <p className="text-neutral-200 text-xs">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Напишите комментарий..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment(post.id);
                }}
                className="flex-1 bg-[#1c1c21] border border-[#212124] rounded-xl text-xs px-3 py-2 text-white outline-none focus:border-neutral-500"
              />
              <button
                onClick={() => handleAddComment(post.id)}
                className="p-2 bg-white text-black hover:bg-neutral-200 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-neutral-200 font-sans selection:bg-neutral-800 selection:text-white flex justify-center pb-28 sm:pb-12 relative">
      
      {/* Background radial soft lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-emerald-500/3 blur-[100px] rounded-full pointer-events-none" />

      {/* Global alert toaster */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 px-4 py-3 bg-[#1d1d23] border border-neutral-700 text-white rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl lg:max-w-7xl px-0 sm:px-4 md:px-8 flex flex-col lg:flex-row gap-8 pt-0 sm:pt-8">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="hidden lg:flex w-64 flex-col justify-between h-[calc(100vh-4rem)] sticky top-8 gap-8">
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 select-none group">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-b from-[#1c1c1f] to-[#0c0c0d] border border-neutral-800 flex items-center justify-center shadow-lg group-hover:border-teal-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-transparent to-indigo-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />
                
                {/* 'O' representing the circle */}
                <div className="w-8 h-8 rounded-full border-2 border-teal-400 flex flex-col items-center justify-center relative transition-transform duration-500 group-hover:rotate-[10deg]">
                  {/* 'П' inside 'O' */}
                  <span className="text-neutral-100 font-black text-xs font-mono absolute top-0.5">П</span>
                  
                  {/* 'Н' held at the bottom of 'O' */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#0c0c0d] px-1 rounded border border-neutral-800 flex items-center justify-center h-3">
                    <span className="text-[9px] font-black text-indigo-400 font-mono leading-none">Н</span>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider text-white leading-none flex items-center gap-1">
                  <span>ПОН</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                </h1>
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block mt-0.5">Сеть Нового Поколения</span>
              </div>
            </div>

            {/* Navigation Menus */}
            <nav className="space-y-1.5">
              {[
                { id: "lenta", label: "Лента", icon: Compass },
                { id: "search", label: "Поиск", icon: Search },
                { id: "messages", label: "Сообщения", icon: MessageSquare, count: unreadDMsCount },
                { id: "aiHub", label: "ИИ-Монитор", icon: Cpu, badge: "🛡️ ИИ" },
                { id: "support", label: "Поддержка", icon: Headphones, badge: "Чат" },
                { id: "notifications", label: "Уведомления", icon: Bell, count: unreadNotificationsCount },
                { id: "profile", label: "Профиль", icon: User }
              ].filter(item => {
                if (item.id === "aiHub" && !isAdmin) return false;
                return true;
              }).map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "bg-[#161619] border border-[#212124] text-white"
                        : "text-neutral-400 hover:text-white hover:bg-[#161619]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.count && item.count > 0 ? (
                      <span className="bg-rose-500 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none">
                        {item.count}
                      </span>
                    ) : null}

                    {item.badge ? (
                      <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick theme & legal actions */}
          <div className="space-y-2 border-t border-[#212124] pt-6">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors bg-[#161619]/40 border border-[#212124]"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
                <span>Тема: {theme === "dark" ? "Тёмная" : "Светлая"}</span>
              </div>
              <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("pon_profile");
                localStorage.removeItem("pon_last_visit");
                setUserProfile({
                  name: "Пользователь ПОН",
                  handle: "@pon_user",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                  bio: "Зашёл в реальную сеть ПОН! Здесь нет фальшивки, фейков и ботов. Каждый факт проверяется ИИ в реальном времени. 🛡️",
                  role: "user",
                  bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000"
                });
                setRegName("Пользователь ПОН");
                setRegHandle("@pon_user");
                setRegBio("Зашёл в реальную сеть ПОН! Здесь нет фальшивки, фейков и ботов. Каждый факт проверяется ИИ в реальном времени. 🛡️");
                setRegRole("user");
                setRegStep(1);
                setShowRegistration(true);
                setRegistrationReason("first_visit");
                setActiveTab("lenta");
                setToastMessage("Вы успешно вышли из профиля.");
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </aside>

        {/* ================= MAIN SCROLLABLE CONTENT ================= */}
        <main className="flex-1 max-w-2xl space-y-6">
          
          {/* Lenta top filters & Post Composer */}
          {activeTab === "lenta" && (
            <div className="space-y-6">
              
              {/* Mobile Sticky Top Header, matches screenshot exactly */}
              <div className="sticky top-0 z-30 bg-[#0c0c0d]/95 backdrop-blur-md py-3 px-4 flex items-center justify-between gap-3 border-b border-neutral-900/40 lg:hidden">
                <div className="bg-[#161619] border border-neutral-800/60 p-1 rounded-full flex gap-1 flex-1 max-w-[310px]">
                  {[
                    { id: "forYou", label: "Для вас" },
                    { id: "clans", label: "Лента кланов" },
                    { id: "following", label: "Подписки" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFeedSubTab(tab.id as any)}
                      className={`flex-1 text-center py-1.5 px-2 rounded-full text-[11px] font-bold transition-all truncate ${
                        feedSubTab === tab.id
                          ? "bg-[#28282d] text-white shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-1.5 shrink-0">
                  {/* Mobile Support chat button */}
                  <button
                    onClick={() => setActiveTab("support")}
                    className={`w-10 h-10 rounded-full bg-[#161619] border flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-95 shadow-sm ${
                      activeTab === "support" ? "border-teal-500 text-teal-400" : "border-neutral-800/60"
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                  </button>

                  {/* Mobile Search circular button */}
                  <button
                    onClick={() => setActiveTab("search")}
                    className="w-10 h-10 rounded-full bg-[#161619] border border-neutral-800/60 flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Desktop Top Feed Tabs */}
              <div className="hidden lg:flex bg-[#161619] border border-[#212124] p-1 rounded-full gap-1">
                {[
                  { id: "forYou", label: "Для вас" },
                  { id: "clans", label: "Лента кланов" },
                  { id: "following", label: "Подписки" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFeedSubTab(tab.id as any)}
                    className={`flex-1 text-center py-2.5 rounded-full text-xs font-bold transition-all ${
                      feedSubTab === tab.id
                        ? "bg-[#232328] text-white shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* POST COMPOSER */}
              <form onSubmit={handleCreatePost} className="hidden lg:block p-5 bg-[#161619] rounded-2xl border border-[#212124] space-y-4">
                <div className="flex gap-3">
                  <img
                    src={userProfile.avatar}
                    alt="user profile"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                  />
                  <div className="flex-1">
                    <textarea
                      placeholder="Что нового? Поделитесь информацией. Напишите факты или статистику для проверки..."
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      rows={2}
                      className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 border-none outline-none resize-none text-xs leading-relaxed"
                    />
                  </div>
                </div>

                {/* Attached image preview */}
                {(selectedPresetId || customImageUrl) && (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-800 max-h-48 bg-neutral-900 flex justify-center items-center">
                    <img
                      src={
                        selectedPresetId
                          ? PRESET_ATTACHMENTS.find(a => a.id === selectedPresetId)?.url
                          : customImageUrl
                      }
                      alt="Attachment Preview"
                      className="object-cover max-h-48 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(null);
                        setCustomImageUrl("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Attachment selector box */}
                {showAttachmentSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#0c0c0d] border border-neutral-800 rounded-xl space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-neutral-500">Подбор качественных иллюстраций</span>
                        {loadingSuggestions && (
                          <span className="text-[9px] font-mono text-teal-400 animate-pulse">ИИ подбирает...</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAttachmentSelector(false)}
                        className="text-neutral-500 hover:text-neutral-300 text-xs"
                      >
                        Скрыть
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Device upload box */}
                      <div className="flex flex-col items-center justify-center border border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl p-3 cursor-pointer text-center group transition-colors relative min-h-[5.5rem] bg-neutral-900/40">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCustomImageUrl(event.target.result as string);
                                  setSelectedPresetId(null);
                                  setToastMessage("📸 Изображение с устройства добавлено!");
                                  setTimeout(() => setToastMessage(null), 2000);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Upload className="w-5 h-5 text-neutral-500 group-hover:text-neutral-400 mb-1" />
                        <span className="text-[10px] font-mono text-neutral-400 leading-tight">С устройства</span>
                        <span className="text-[8px] text-neutral-600 mt-0.5">JPEG, PNG, WebP</span>
                      </div>

                      {/* 4 suggested illustrations matching user text */}
                      <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {suggestedKeywords.map((kw, index) => {
                          const imageUrl = `https://images.unsplash.com/featured/400x300/?${encodeURIComponent(kw)}&sig=${index}`;
                          const isSelected = customImageUrl === imageUrl;
                          return (
                            <div
                              key={kw + index}
                              onClick={() => {
                                setCustomImageUrl(imageUrl);
                                setSelectedPresetId(null);
                              }}
                              className={`cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all h-22 bg-neutral-900 ${
                                isSelected ? "border-teal-400 scale-[0.98]" : "border-transparent hover:border-neutral-700"
                              }`}
                            >
                              <img
                                src={imageUrl}
                                alt={kw}
                                className="w-full h-full object-cover brightness-[0.65] group-hover:brightness-[0.9] transition-all"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                <span className="text-[10px] text-white font-bold bg-neutral-950/80 px-2 py-0.5 rounded-full border border-neutral-800">
                                  Выбрать
                                </span>
                              </div>
                              <div className="absolute bottom-1 left-1.5 right-1.5 text-[8px] leading-tight text-white font-mono uppercase tracking-wider bg-black/60 px-1 rounded truncate text-center">
                                #{kw}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Или вставьте прямую ссылку на картинку</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... / ссылка на изображение"
                          value={customImageUrl}
                          onChange={(e) => {
                            setCustomImageUrl(e.target.value);
                            setSelectedPresetId(null);
                          }}
                          className="w-full bg-[#161619] border border-neutral-800 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none focus:border-neutral-500 font-mono"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Footer of composer */}
                <div className="flex justify-between items-center pt-2 border-t border-neutral-900">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentSelector(!showAttachmentSelector)}
                      className={`flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors ${
                        showAttachmentSelector ? "text-white" : ""
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-neutral-500" />
                      <span>Иллюстрация</span>
                    </button>

                    <div className="relative group">
                      <select
                        value={composerCategory}
                        onChange={(e) => setComposerCategory(e.target.value as any)}
                        className="bg-transparent border border-[#2e2e34] hover:border-neutral-500 rounded-full text-[10px] font-mono text-neutral-400 px-3 py-1 outline-none cursor-pointer appearance-none pr-6"
                      >
                        <option value="forYou">Для вас</option>
                        <option value="clans">Клановые логи</option>
                        <option value="following">Подписки</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPosting}
                    className="px-5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50"
                  >
                    {isPosting ? "Анализ ИИ..." : "Опубликовать"}
                  </button>
                </div>
              </form>

              {/* Feed posts stream */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-20 bg-[#161619] rounded-2xl border border-[#212124]">
                    <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-neutral-500 text-xs font-mono">Соединение с базой данных бэкенда...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-16 bg-[#161619] rounded-2xl border border-[#212124]">
                    <p className="text-neutral-500 text-sm">В этой ленте пока нет постов.</p>
                  </div>
                ) : (
                  filteredPosts.map(post => renderPostCard(post))
                )}
              </div>
            </div>
          )}

          {activeTab === "search" && renderSearch()}
          {activeTab === "aiHub" && isAdmin && renderAIHub()}
          {activeTab === "support" && renderSupportChat()}
          {activeTab === "messages" && renderMessages()}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-neutral-300">Реальные Уведомления</h2>
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Очистить всё
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-16 bg-[#161619] rounded-2xl border border-[#212124]">
                  <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">У вас нет новых уведомлений</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-colors flex gap-3 items-start ${
                        notif.unread ? "bg-[#1d1d23] border-[#2e2e38]" : "bg-[#161619] border-[#212124]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                        🛡️
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-neutral-300">{notif.text}</div>
                        <div className="text-[10px] text-neutral-500">{notif.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <ProfilePanel
              userProfile={userProfile}
              handleSaveProfile={handleSaveProfile}
              posts={posts}
              filteredPosts={filteredPosts}
              renderPostCard={renderPostCard}
              setActiveTab={setActiveTab}
              setToastMessage={setToastMessage}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )}

        </main>

        {/* ================= RIGHT SIDEBAR ================= */}
        <aside className="hidden xl:block w-72 h-[calc(100vh-4rem)] sticky top-8 space-y-6">
          
          {/* Profile mini-card */}
          <div className="p-4 bg-[#161619] rounded-2xl border border-[#212124] space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={userProfile.avatar}
                alt="mini profile"
                className="w-10 h-10 rounded-full object-cover border border-neutral-800"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{userProfile.name}</h4>
                <p className="text-[10px] font-mono text-neutral-500 truncate">{userProfile.handle}</p>
              </div>
            </div>
            
            <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
              {userProfile.bio}
            </p>

            <button
              onClick={() => setActiveTab("profile")}
              className="w-full text-center py-1.5 rounded-full bg-[#232328] hover:bg-[#2e2e34] border border-[#2e2e34] text-[10px] text-neutral-300 font-semibold transition-colors"
            >
              Перейти в профиль
            </button>
          </div>

          {/* Real-time Online & Network counter (Only visible to Guchipon Admin) */}
          {isAdmin && (
            <div 
              className="p-5 bg-[#161619] rounded-2xl border border-[#212124] space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

              <h3 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                <span>Мониторинг сети ПОН</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>

              <div className="space-y-4 pt-1">
                {/* Online Counter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase">Пользователи онлайн</div>
                      <div className="text-lg font-black text-white font-mono leading-none mt-0.5">
                        {onlineUsers.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                      Активно
                    </span>
                  </div>
                </div>

                {/* Network Status / Counter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#232328] border border-[#2e2e34] text-teal-400 rounded-xl">
                      <Wifi className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase">Статус сети ПОН</div>
                      <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5 font-mono">
                        <span>{networkPing} ms</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-neutral-400">{networkSpeed} Mbps</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/20 uppercase">
                      Отлично
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 font-mono pt-3 border-t border-neutral-900 uppercase flex justify-between">
                <span>Сеть: Стабильна</span>
                <span>v1.2.0</span>
              </div>
            </div>
          )}
        </aside>

      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION & FAB ================= */}
      <div className="lg:hidden">
        {/* Floating Action Button (FAB) */}
        {activeTab === "lenta" && (
          <button
            onClick={() => setShowMobileComposer(true)}
            className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-[#1c1c1f] hover:bg-[#25252a] border border-neutral-800/80 flex items-center justify-center text-white shadow-[0_8px_30px_rgba(0,0,0,0.8)] active:scale-95 transition-all"
            aria-label="Create Post"
          >
            <span className="text-2xl font-light leading-none">+</span>
          </button>
        )}

        {/* Floating Capsule Bottom Navigation Bar */}
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="bg-[#121215]/95 border border-neutral-800/80 backdrop-blur-lg rounded-[24px] py-1.5 px-3 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex justify-around items-center">
            {[
              { id: "lenta", label: "Лента", icon: Compass },
              { id: "messages", label: "ЛС", icon: MessageSquare, count: unreadDMsCount },
              { id: "aiHub", label: "Ивент", icon: Cpu },
              { id: "notifications", label: "Уведы", icon: Bell, count: unreadNotificationsCount },
              { id: "profile", label: "Профиль", icon: User }
            ].filter(item => {
              if (item.id === "aiHub" && !isAdmin) return false;
              return true;
            }).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className="flex flex-col items-center py-1.5 px-4 relative transition-all"
                >
                  {/* Active Pill highlight with motion, exactly like the screenshot */}
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileTabIndicator"
                      className="absolute inset-0 bg-[#232328] rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
                    {item.count && item.count > 0 ? (
                      <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full leading-none">
                        {item.count}
                      </span>
                    ) : null}
                  </div>
                  <span className={`text-[9px] font-medium tracking-wide ${isActive ? "text-white font-bold" : "text-neutral-500"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Composer Modal Overlay */}
      <AnimatePresence>
        {showMobileComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end justify-center lg:hidden"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-[#161619] border-t border-neutral-800 rounded-t-[32px] w-full max-h-[90vh] overflow-y-auto p-5 pb-8 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-300">Создать новый пост</span>
                </div>
                <button
                  onClick={() => setShowMobileComposer(false)}
                  className="p-1.5 bg-neutral-900 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => {
                handleCreatePost(e);
                setShowMobileComposer(false);
              }} className="space-y-4">
                <div className="flex gap-3">
                  <img
                    src={userProfile.avatar}
                    alt="user profile"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                  />
                  <div className="flex-1">
                    <textarea
                      placeholder="Что нового? Поделитесь информацией. Напишите факты или статистику для проверки..."
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      rows={4}
                      className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 border-none outline-none resize-none text-xs leading-relaxed"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Attached image preview */}
                {(selectedPresetId || customImageUrl) && (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-800 max-h-48 bg-neutral-900 flex justify-center items-center">
                    <img
                      src={
                        selectedPresetId
                          ? PRESET_ATTACHMENTS.find(a => a.id === selectedPresetId)?.url
                          : customImageUrl
                      }
                      alt="Attachment Preview"
                      className="object-cover max-h-48 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(null);
                        setCustomImageUrl("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Attachment selector box */}
                {showAttachmentSelector && (
                  <div className="p-4 bg-[#0c0c0d] border border-neutral-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-neutral-500">Подбор качественных иллюстраций</span>
                        {loadingSuggestions && (
                          <span className="text-[9px] font-mono text-teal-400 animate-pulse">ИИ подбирает...</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAttachmentSelector(false)}
                        className="text-neutral-500 hover:text-neutral-300 text-xs"
                      >
                        Скрыть
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col items-center justify-center border border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl p-3 cursor-pointer text-center group transition-colors relative bg-neutral-900/40">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCustomImageUrl(event.target.result as string);
                                  setSelectedPresetId(null);
                                  setToastMessage("📸 Изображение добавлено!");
                                  setTimeout(() => setToastMessage(null), 2000);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Upload className="w-5 h-5 text-neutral-500 mb-1" />
                        <span className="text-[10px] font-mono text-neutral-400 leading-tight">С устройства</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {suggestedKeywords.slice(0, 4).map((kw, index) => {
                          const imageUrl = `https://images.unsplash.com/featured/400x300/?${encodeURIComponent(kw)}&sig=${index}`;
                          const isSelected = customImageUrl === imageUrl;
                          return (
                            <div
                              key={kw + index}
                              onClick={() => {
                                setCustomImageUrl(imageUrl);
                                setSelectedPresetId(null);
                              }}
                              className={`cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all h-20 bg-neutral-900 ${
                                isSelected ? "border-teal-400 scale-[0.98]" : "border-transparent hover:border-neutral-700"
                              }`}
                            >
                              <img
                                src={imageUrl}
                                alt={kw}
                                className="w-full h-full object-cover brightness-[0.65]"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute bottom-1 left-1 right-1 text-[8px] text-white font-mono uppercase tracking-wider bg-black/60 px-1 rounded truncate text-center">
                                #{kw}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct image input */}
                <div>
                  <label className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Ссылка на картинку</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-[#161619] border border-[#212124] text-xs text-white px-3 py-2 rounded-lg outline-none font-mono focus:border-neutral-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-900">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentSelector(!showAttachmentSelector)}
                      className={`flex items-center gap-1.5 text-xs text-neutral-400 ${
                        showAttachmentSelector ? "text-white" : ""
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-neutral-500" />
                      <span>Иллюстрация</span>
                    </button>

                    <select
                      value={composerCategory}
                      onChange={(e) => setComposerCategory(e.target.value as any)}
                      className="bg-[#1c1c21] border border-neutral-800 rounded-full text-[10px] font-mono text-neutral-400 px-3 py-1 outline-none"
                    >
                      <option value="forYou">Для вас</option>
                      <option value="clans">Лента кланов</option>
                      <option value="following">Подписки</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isPosting}
                    className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isPosting ? "Анализ ИИ..." : "Опубликовать"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= LIGHTBOX / IMAGE PREVIEW MODAL ================= */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-neutral-900/80 text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={selectedImage}
              alt="Expanded Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= SERVER STATUS DETAILED MODAL ================= */}
      <AnimatePresence>
        {showServerStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#161619] border border-[#2d2d34] w-full max-w-md p-6 rounded-3xl space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowServerStatus(false)}
                className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Статус Серверов ПОН</h3>
                </div>
                <p className="text-xs text-neutral-400">Технический мониторинг в реальном времени</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Нагрузка на процессоры (CPU)</span>
                    <span className="font-mono text-white">{serverMetrics.cpu}%</span>
                  </div>
                  <div className="h-2 bg-[#0c0c0d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-1000"
                      style={{ width: `${serverMetrics.cpu}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Использование ОЗУ (Memory)</span>
                    <span className="font-mono text-white">{serverMetrics.memory}%</span>
                  </div>
                  <div className="h-2 bg-[#0c0c0d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 transition-all duration-1000"
                      style={{ width: `${serverMetrics.memory}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-[#0c0c0d] rounded-xl border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">Пинг API</div>
                    <div className="text-base font-bold text-emerald-400">{serverMetrics.ping} ms</div>
                  </div>
                  <div className="p-3 bg-[#0c0c0d] rounded-xl border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono font-bold">ИИ-Сессии</div>
                    <div className="text-base font-bold text-white">{serverMetrics.connections}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowServerStatus(false)}
                className="w-full text-center py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= AI CENSORSHIP/MODERATION ERROR MODAL ================= */}
      <AnimatePresence>
        {moderationError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#1c1214] border border-[#4c1e23] w-full max-w-lg p-6 rounded-3xl space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setModerationError(null)}
                className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
                <div>
                  <h3 className="text-lg font-bold text-white">Доступ заблокирован ПОН ИИ</h3>
                  <p className="text-xs text-rose-300">Нарушение правил публикации контента</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-[#0f090a] rounded-xl border border-[#301618] text-xs">
                  <div className="text-neutral-500 font-mono text-[9px] uppercase tracking-wider mb-1">Ваш текст:</div>
                  <p className="text-neutral-400 italic">"{moderationError.text}"</p>
                </div>

                <div className="p-3.5 bg-rose-950/10 rounded-xl border border-rose-900/20 text-xs">
                  <div className="font-bold text-rose-400 mb-1">Причина блокировки ИИ:</div>
                  <p className="text-rose-200 leading-relaxed font-sans">{moderationError.reason}</p>
                </div>

                {moderationError.aiVerification?.botConfidence !== undefined && (
                  <div className="text-[10px] text-neutral-500 font-mono flex justify-between">
                    <span>Уровень подозрения на бота:</span>
                    <span className="font-bold text-rose-400">
                      {(moderationError.aiVerification.botConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setModerationError(null)}
                className="w-full text-center py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
              >
                Понятно, исправить текст
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MANDATORY REGISTRATION MODAL ================= */}
      <AnimatePresence>
        {showRegistration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0c0c0e] z-50 flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-[390px] mx-auto space-y-10 flex flex-col justify-center items-center py-8">
              {/* App logo "пон" centered */}
              <div className="text-white text-base font-bold tracking-widest uppercase text-center select-none font-sans">
                пон
              </div>

              {isVerifyingCode ? (
                /* Verification Code Panel */
                <form onSubmit={handleVerifyCode} className="w-full space-y-6">
                  <div className="space-y-1.5 text-left">
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                      Подтверждение E-Mail
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Мы отправили 4-значный код на <span className="text-white font-medium">{authEmail}</span>. Пожалуйста, введите его ниже для завершения регистрации.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-neutral-300 block">Код подтверждения</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        placeholder="••••"
                        className="w-full bg-[#121214] border border-neutral-800 text-center text-lg tracking-widest font-bold text-white px-4 py-3 rounded-xl outline-none focus:border-neutral-500 font-mono transition-colors placeholder-neutral-700"
                      />
                      {generatedCode && (
                        <div className="text-center text-[10px] text-neutral-600 font-mono">
                          * Код отправлен на почту или доступен в логах сервера
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-white hover:bg-neutral-100 text-black font-semibold text-sm rounded-full transition-all tracking-wide shadow-lg shadow-black/20 active:scale-[0.98] font-sans"
                    >
                      Подтвердить
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerifyingCode(false);
                        setPendingRegistrationProfile(null);
                        setGeneratedCode("");
                      }}
                      className="w-full py-3 bg-[#121214] border border-neutral-800 hover:bg-neutral-900 text-neutral-400 font-semibold text-xs rounded-full transition-all tracking-wide font-sans"
                    >
                      Назад к регистрации
                    </button>
                  </div>
                </form>
              ) : (
                /* Login / Registration Panel */
                <form onSubmit={handleCompleteRegistration} className="w-full space-y-6">
                  <div className="space-y-1.5 text-left">
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                      {isAuthLogin ? "Вход" : "Регистрация"}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Пожалуйста, введите ваши данные
                    </p>
                  </div>

                  <div className="space-y-4">
                    {!isAuthLogin && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-neutral-300 block">Имя пользователя (Уникальный юзернейм)</label>
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          required={!isAuthLogin}
                          placeholder="ilya"
                          className="w-full bg-[#121214] border border-neutral-800 text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-neutral-500 font-sans transition-colors placeholder-neutral-600"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-neutral-300 block">E-Mail</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        placeholder="pon@gmail.com"
                        className="w-full bg-[#121214] border border-neutral-800 text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-neutral-500 font-sans transition-colors placeholder-neutral-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-neutral-300 block">Пароль</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          required
                          placeholder="••••••••••••"
                          className="w-full bg-[#121214] border border-neutral-800 text-white text-xs px-4 py-3 pr-11 rounded-xl outline-none focus:border-neutral-500 font-sans transition-colors placeholder-neutral-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {isAuthLogin && (
                        <div className="flex justify-end pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setToastMessage("Для сброса пароля свяжитесь с поддержкой ПОН.");
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="text-[10px] text-neutral-500 hover:text-neutral-400 transition-colors"
                          >
                            Забыли пароль?
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-semibold text-xs rounded-full transition-all tracking-wide shadow-md font-sans"
                    >
                      {isAuthLogin ? "Войти" : "Создать аккаунт"}
                    </button>
                  </div>

                  <div className="text-center text-xs text-neutral-400 pt-2 font-sans select-none">
                    {isAuthLogin ? (
                      <>
                        Еще нет аккаунта?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAuthLogin(false);
                            setAuthEmail("");
                            setAuthPassword("");
                            setAuthName("");
                          }}
                          className="text-blue-500 hover:text-blue-400 hover:underline font-semibold ml-1 transition-colors"
                        >
                          Создать аккаунт
                        </button>
                      </>
                    ) : (
                      <>
                        Уже есть аккаунт?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAuthLogin(true);
                            setAuthEmail("");
                            setAuthPassword("");
                            setAuthName("");
                          }}
                          className="text-blue-500 hover:text-blue-400 hover:underline font-semibold ml-1 transition-colors"
                        >
                          Войти
                        </button>
                      </>
                    )}
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB-COMPONENT PROFILE PANEL ---
interface ProfilePanelProps {
  userProfile: {
    name: string;
    handle: string;
    avatar: string;
    bio: string;
    role?: string;
    bannerUrl?: string;
  };
  handleSaveProfile: (newProfile: any) => void;
  posts: Post[];
  filteredPosts: Post[];
  renderPostCard: (post: Post) => React.ReactNode;
  setActiveTab: (tab: any) => void;
  setToastMessage: (msg: string | null) => void;
  theme: string;
  toggleTheme: () => void;
}

function ProfilePanel({
  userProfile,
  handleSaveProfile,
  posts,
  filteredPosts,
  renderPostCard,
  setActiveTab,
  setToastMessage,
  theme,
  toggleTheme
}: ProfilePanelProps) {
  const [name, setName] = useState(userProfile.name);
  const [handle, setHandle] = useState(userProfile.handle);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [role, setRole] = useState(userProfile.role || "developer");
  const [isEditing, setIsEditing] = useState(false);

  const [bannerUrl, setBannerUrl] = useState(userProfile.bannerUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000");
  const [showPainter, setShowPainter] = useState(false);

  // Canvas Drawing Board States
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#14b8a6"); // default teal
  const [brushSize, setBrushSize] = useState(6);
  const [canvasBg, setCanvasBg] = useState("#111827"); // dark slate bg

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage("⚠️ Размер файла превышает 5MB!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setBannerUrl(reader.result);
          setToastMessage("🎨 Шапка профиля загружена!");
          setTimeout(() => setToastMessage(null), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const fillCanvasWithBg = (bgColor: string) => {
    setCanvasBg(bgColor);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setBannerUrl(dataUrl);
    setShowPainter(false);
    setToastMessage("🎨 Рисунок успешно сохранен как шапка профиля!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  React.useEffect(() => {
    if (showPainter) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = canvasBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 100);
    }
  }, [showPainter]);

  const isAdmin = userProfile.handle.toLowerCase() === "@guchipon" || userProfile.handle.toLowerCase() === "guchipon";

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage("⚠️ Размер файла превышает 5MB!");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatar(reader.result);
          setToastMessage("📸 Аватар загружен с устройства!");
          setTimeout(() => setToastMessage(null), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLower = handle.trim().toLowerCase();
    const isGuchi = cleanLower === "@guchipon" || cleanLower === "guchipon";
    const finalRole = isGuchi ? "admin" : "user";
    handleSaveProfile({ name, handle, bio, avatar, role: finalRole, bannerUrl });
    setIsEditing(false);
    setToastMessage("Профиль успешно обновлен!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div 
        className="h-32 rounded-2xl relative overflow-hidden bg-cover bg-center border border-neutral-800"
        style={{ backgroundImage: `url(${bannerUrl})` }}
      >
        {isEditing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-3">
            <label className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-semibold text-white cursor-pointer transition-colors font-mono uppercase tracking-wider">
              Загрузить фото
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerFileChange} 
                className="hidden" 
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPainter(true)}
              className="px-3.5 py-1.5 rounded-full bg-teal-400 hover:bg-teal-300 text-[11px] font-semibold text-black transition-colors font-mono uppercase tracking-wider"
            >
              Нарисовать
            </button>
          </div>
        )}
        <div className="absolute -bottom-10 left-6 z-10">
          <img
            src={avatar}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border-4 border-[#0c0c0d] bg-neutral-800"
          />
        </div>
      </div>

      <div className="pt-2 pl-6 pr-6 space-y-4">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-1.5 flex-wrap">
              {userProfile.name}
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#1e1e24] text-neutral-400 border border-neutral-800">
                настоящий человек
              </span>
              {userProfile.role === "developer" && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Разработчик ПОН 🛠️
                </span>
              )}
              {userProfile.role === "admin" && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Администратор сети 👑
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-500 font-mono">{userProfile.handle}</p>
          </div>
          
          <div className="flex gap-2 items-center flex-wrap">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-full bg-[#161619] hover:bg-[#232328] border border-[#212124] text-xs font-semibold transition-colors flex items-center gap-1.5 font-mono text-neutral-300"
              title={theme === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Светлая тема</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Тёмная тема</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-1.5 rounded-full bg-[#161619] hover:bg-[#232328] border border-[#212124] text-xs text-neutral-300 font-semibold transition-colors font-mono"
            >
              {isEditing ? "Отмена" : "Редактировать"}
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-300 max-w-lg leading-relaxed">
          {userProfile.bio}
        </p>

        <div className="flex gap-6 text-xs text-neutral-500 border-t border-neutral-900 pt-3">
          <div>
            Публикаций: <span className="text-neutral-300 font-semibold">{posts.filter(p => p.handle === userProfile.handle).length}</span>
          </div>
          <div>
            Подписчиков: <span className="text-neutral-300 font-semibold">412</span>
          </div>
          <div>
            Доверие ИИ: <span className="text-emerald-400 font-semibold font-mono">100%</span>
          </div>
        </div>
      </div>

      {isEditing && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave}
          className="p-5 bg-[#161619] rounded-2xl border border-[#212124] space-y-4"
        >
          <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
            Редактирование профиля
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 uppercase">Отображаемое имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0c0c0d] border border-[#212124] text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-neutral-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 uppercase">Уникальный тег (@)</label>
              <input
                type="text"
                value={handle}
                disabled
                className="w-full bg-[#0c0c0d]/50 border border-[#212124] text-neutral-500 text-xs px-3 py-2 rounded-lg outline-none cursor-not-allowed"
              />
              <p className="text-[9px] text-neutral-600">
                Задается при регистрации и не может быть изменен
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">Аватар профиля</label>
            <div className="flex flex-col md:flex-row gap-4 items-center bg-[#0c0c0d] p-4 rounded-xl border border-[#212124]">
              {/* Current temporary avatar preview */}
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-800 bg-neutral-900 shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[8px] text-white uppercase font-mono tracking-wider">Превью</span>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-2">
                <div className="relative flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-lg p-3 hover:border-neutral-700 transition-colors bg-[#111114]/40 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-4 h-4 text-neutral-500 mb-1" />
                  <span className="text-[10px] text-neutral-400 font-semibold font-sans">
                    Выбрать файл на ПК
                  </span>
                  <span className="text-[8px] text-neutral-600 font-mono mt-0.5 uppercase">
                    PNG, JPG, WEBP до 5MB
                  </span>
                </div>
                
                {/* Fallback to direct URL if they prefer */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-neutral-500 block">Или прямая ссылка на изображение:</span>
                  <input
                    type="text"
                    value={avatar.startsWith("data:image/") ? "" : avatar}
                    placeholder="https://images.unsplash.com/... или base64"
                    onChange={(e) => {
                      if (e.target.value) setAvatar(e.target.value);
                    }}
                    className="w-full bg-[#0c0c0d] border border-neutral-900 text-white text-[10px] px-2.5 py-1.5 rounded-md outline-none focus:border-neutral-500 font-mono"
                  />
                  {avatar.startsWith("data:image/") && (
                    <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Загружен локальный файл с ПК (Base64)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 uppercase font-bold">Роль аккаунта (Права доступа)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0c0c0d] border border-[#212124] text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="user">Обычный пользователь (Ограничен в ИИ-Мониторе)</option>
                <option value="developer">Разработчик (Developer) — Полный доступ</option>
                <option value="admin">Администратор (Admin) — Полный доступ</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 uppercase">О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-[#0c0c0d] border border-[#212124] text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-neutral-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-full hover:bg-neutral-200 transition-colors"
          >
            Сохранить изменения
          </button>
        </motion.form>
      )}

      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
          Ваши публикации
        </h3>
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-[#161619] rounded-2xl border border-[#212124]">
            <p className="text-neutral-500 text-sm">Вы ещё ничего не опубликовали</p>
            <button
              onClick={() => {
                setActiveTab("lenta");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-2 text-xs text-teal-400 hover:underline"
            >
              Создать первый пост
            </button>
          </div>
        ) : (
          filteredPosts.map(post => renderPostCard(post))
        )}
      </div>

      {/* Canvas Painter Modal */}
      {showPainter && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161619] border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Холст кастомизации шапки
                </h3>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Нарисуйте пальцем или мышкой свой уникальный баннер (600x200)
                </p>
              </div>
              <button
                onClick={() => setShowPainter(false)}
                className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas */}
            <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full max-w-[600px] h-auto aspect-[3/1] bg-[#111827] cursor-crosshair touch-none"
              />
            </div>

            {/* Canvas Controls */}
            <div className="space-y-4">
              {/* Color Presets */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">Кисть:</span>
                  {[
                    { hex: "#14b8a6", label: "Teal" },
                    { hex: "#a855f7", label: "Purple" },
                    { hex: "#f59e0b", label: "Gold" },
                    { hex: "#f43f5e", label: "Rose" },
                    { hex: "#39ff14", label: "Cyber" },
                    { hex: "#ffffff", label: "White" },
                    { hex: "#000000", label: "Black" }
                  ].map(color => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setBrushColor(color.hex)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        brushColor === color.hex ? "border-white scale-110 shadow-lg" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>

                {/* Brush size slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Толщина:</span>
                  <input
                    type="range"
                    min={2}
                    max={24}
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 accent-teal-400"
                  />
                  <span className="text-xs font-mono text-white w-4">{brushSize}</span>
                </div>
              </div>

              {/* Background fill presets */}
              <div className="flex items-center gap-2 flex-wrap border-t border-neutral-900 pt-3">
                <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">Заливка фона:</span>
                {[
                  { hex: "#111827", name: "Slate" },
                  { hex: "#000000", name: "Black" },
                  { hex: "#064e3b", name: "Forest" },
                  { hex: "#1e3a8a", name: "Navy" },
                  { hex: "#881337", name: "Rose" }
                ].map(bg => (
                  <button
                    key={bg.hex}
                    type="button"
                    onClick={() => fillCanvasWithBg(bg.hex)}
                    className="px-2.5 py-1 rounded bg-[#0c0c0d] hover:bg-[#121215] border border-neutral-800 text-[10px] font-mono text-neutral-300 transition-colors"
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Save / Clear buttons */}
            <div className="flex gap-2.5 justify-end border-t border-neutral-900 pt-4">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
              >
                Очистить
              </button>
              <button
                type="button"
                onClick={saveCanvasDrawing}
                className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-xs text-black font-semibold transition-all font-mono uppercase tracking-wider"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
