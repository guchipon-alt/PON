# Dockerfile for PON Social Network (Node + Express + Vite build)
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/posts-db.json ./posts-db.json
COPY package*.json ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
