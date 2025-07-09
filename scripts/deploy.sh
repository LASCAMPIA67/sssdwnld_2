#!/bin/bash

set -e

echo "🚀 Déploiement de sssdwnld..."

# Variables
REPO_URL="https://github.com/LASCAMPIA67/sssdwnld_2.git"
DEPLOY_PATH="/var/www/sssdwnld_2"
BRANCH="main"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Fonction d'erreur
error_exit() {
    echo -e "${RED}❌ Erreur: $1${NC}" >&2
    exit 1
}

# Vérifier si on est root
if [[ $EUID -ne 0 ]]; then
   error_exit "Ce script doit être exécuté en tant que root"
fi

echo "📦 Mise à jour du système..."
apt update -qq

echo "🔧 Installation des dépendances..."
apt install -y git nodejs npm nginx redis-server certbot python3-certbot-nginx

echo "📥 Clonage/Mise à jour du repository..."
if [ -d "$DEPLOY_PATH" ]; then
    cd $DEPLOY_PATH
    git pull origin $BRANCH
else
    git clone $REPO_URL $DEPLOY_PATH
    cd $DEPLOY_PATH
fi

echo "📦 Installation des packages npm..."
npm install --production

echo "🏗️ Build du frontend..."
npm run build

echo "🔧 Configuration des permissions..."
chown -R www-data:www-data $DEPLOY_PATH
chmod -R 755 $DEPLOY_PATH

echo "⚙️ Installation de PM2..."
npm install -g pm2

echo "🚀 Démarrage de l'application..."
pm2 stop sssdwnld_2-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo "🔧 Configuration Nginx..."
cp nginx.conf /etc/nginx/sites-available/sssdwnld
ln -sf /etc/nginx/sites-available/sssdwnld /etc/nginx/sites-enabled/
nginx -t || error_exit "Configuration Nginx invalide"
systemctl reload nginx

echo "🔒 Configuration SSL..."
if ! [ -f /etc/letsencrypt/live/sssdwnld.com/fullchain.pem ]; then
    certbot --nginx -d sssdwnld.com -d www.sssdwnld.com --non-interactive --agree-tos -m admin@sssdwnld.com
fi

echo "🔥 Configuration du firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo "👉 Votre site est accessible sur https://sssdwnld.com"