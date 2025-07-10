#!/bin/bash
# scripts/deploy.sh - Met à jour l'application en utilisant Docker Compose

set -e

echo "🚀 Déploiement de la nouvelle version de sssdwnld..."

# Se positionner dans le répertoire du projet
cd /var/www/sssdwnld_2

# S'assurer que le code est à jour avec la branche main
echo "🔄 Mise à jour du code source..."
git pull origin main

# Mettre à jour et redémarrer les services avec Docker Compose
echo "🐳 Build et redémarrage des containers Docker..."
docker-compose up -d --build

# Nettoyer les anciennes images Docker non utilisées
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo "✅ Déploiement terminé avec succès !"