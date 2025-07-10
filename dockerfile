# Dockerfile

# ---- Stage 1: Build Frontend ----
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les package.json de la racine et des workspaces
COPY package.json package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Installer toutes les dépendances
RUN npm install

# Copier le code source du frontend
COPY packages/frontend ./packages/frontend

# Build le frontend
RUN npm run build --workspace=frontend


# ---- Stage 2: Production Backend ----
FROM node:18-alpine

WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production

# Copier les package.json et installer UNIQUEMENT les dépendances de prod
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
RUN npm install --omit=dev

# Copier le code du backend
COPY packages/backend ./packages/backend

# Copier le build du frontend depuis le stage précédent
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "packages/backend/server.js"]