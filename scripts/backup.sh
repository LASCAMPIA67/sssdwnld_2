#!/bin/bash
# scripts/backup.sh - Crée un backup des données persistantes (logs)

set -e

BACKUP_DIR="/var/backups/sssdwnld"
SOURCE_DIR="/var/www/sssdwnld_2"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FINAL_ARCHIVE="$BACKUP_DIR/sssdwnld_backup_$DATE.tar.gz"

echo "📦 Création du backup..."

mkdir -p "$BACKUP_DIR"

# Créer une archive des logs
tar -czf "$FINAL_ARCHIVE" -C "$SOURCE_DIR" logs

# Supprimer les backups de plus de 30 jours
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup créé avec succès : $FINAL_ARCHIVE"