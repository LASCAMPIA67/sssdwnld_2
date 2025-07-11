# Dockerfile - Version optimisée avec cache et sécurité

# ---- Stage 1: Build Frontend ----
FROM node:20-alpine AS frontend-builder

# Installer les dépendances système pour la compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers de configuration npm
COPY package.json package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/

# Installer uniquement les dépendances du frontend
RUN npm ci --workspace=frontend --include-workspace-root

# Copier le code source du frontend
COPY packages/frontend ./packages/frontend

# Build le frontend avec optimisations
ENV NODE_ENV=production
RUN npm run build --workspace=frontend

# ---- Stage 2: Production Dependencies ----
FROM node:20-alpine AS prod-dependencies

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers package
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev --workspace=backend --include-workspace-root && \
    npm cache clean --force

# ---- Stage 3: Final Production Image ----
FROM node:20-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    ca-certificates \
    tini && \
    # Créer un utilisateur non-root
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copier les dépendances de production
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/packages/backend/node_modules ./packages/backend/node_modules

# Copier le code du backend
COPY --chown=nodejs:nodejs packages/backend ./packages/backend

# Copier le build du frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/packages/frontend/dist ./packages/frontend/dist

# Copier les fichiers racine nécessaires
COPY --chown=nodejs:nodejs package.json ./

# Créer les dossiers nécessaires
RUN mkdir -p packages/backend/logs packages/backend/bin /tmp/sssdwnld && \
    chown -R nodejs:nodejs packages/backend/logs packages/backend/bin /tmp/sssdwnld

# Télécharger yt-dlp au moment du build pour le cache
RUN su nodejs -c "cd packages/backend && node -e \"const YtDlpWrap = require('yt-dlp-wrap'); YtDlpWrap.downloadFromGithub('./bin/yt-dlp').then(() => console.log('yt-dlp téléchargé')).catch(console.error)\""

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Utiliser tini pour une gestion propre des processus
ENTRYPOINT ["/sbin/tini", "--"]

# Commande de démarrage
CMD ["node", "packages/backend/server.js"]