# syntax=docker/dockerfile:1

# ---------- Этап 1: сборка фронтенда (Vite SPA) ----------
FROM node:22-alpine AS frontend-build
WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ---------- Этап 2: сборка бэкенда (Express + TypeScript) ----------
FROM node:22-alpine AS backend-build
WORKDIR /build/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build


# ---------- Этап 3: рантайм ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Скомпилированный сервер и статика фронтенда, которую он раздаёт.
COPY --from=backend-build /build/backend/dist ./dist
COPY --from=frontend-build /build/frontend/dist ./public

# Значение по умолчанию; Render/Railway подставляют своё через PORT.
ENV PORT=3000
EXPOSE 3000

USER node
CMD ["node", "dist/index.js"]
