# Etape 1: Builder le Frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/
RUN npm install
COPY . .
RUN npm run build --workspace=frontend

# Etape 2: Build final du Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
RUN npm install --workspace=backend --omit=dev
COPY packages/backend ./packages/backend
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O ./packages/backend/bin/yt-dlp && \
    chmod a+rx ./packages/backend/bin/yt-dlp

# Etape 3: Image de production finale
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appuser && adduser -S appuser -G appuser
COPY --from=backend-builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=backend-builder --chown=appuser:appuser /app/packages/backend ./packages/backend
COPY --from=builder --chown=appuser:appuser /app/packages/frontend/dist ./packages/frontend/dist
USER appuser
EXPOSE 3000
CMD ["node", "packages/backend/server.js"]