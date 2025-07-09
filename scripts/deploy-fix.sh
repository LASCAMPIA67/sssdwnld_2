#!/bin/bash

set -e

echo "🔧 Correction et déploiement de sssdwnld..."

# Build le frontend
echo "🏗️ Build du frontend..."
cd /var/www/sssdwnld_2
npm install
npm run build

# Créer le fichier .env si nécessaire
if [ ! -f "packages/backend/.env" ]; then
    echo "NODE_ENV=production" > packages/backend/.env
    echo "PORT=3000" >> packages/backend/.env
fi

# Permissions
chown -R www-data:www-data /var/www/sssdwnld_2
chmod -R 755 /var/www/sssdwnld_2

# PM2
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Nginx
nginx -t
systemctl restart nginx

# Test
sleep 3
curl -s http://localhost:3000/api/v1/health | jq

echo "✅ Déploiement terminé!"