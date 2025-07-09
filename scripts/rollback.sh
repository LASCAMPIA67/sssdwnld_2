#!/bin/bash

echo "⏪ Rollback sssdwnld..."

# Trouver le dernier backup
LAST_BACKUP=$(ls -t /var/www/sssdwnld_2_backup_* | head -1)

if [ -z "$LAST_BACKUP" ]; then
    echo "❌ Aucun backup trouvé!"
    exit 1
fi

echo "Restauration depuis: $LAST_BACKUP"

# Restaurer
rm -rf /var/www/sssdwnld_2
cp -r $LAST_BACKUP /var/www/sssdwnld_2

# Redémarrer
cd /var/www/sssdwnld_2
pm2 reload sssdwnld_2-backend

echo "✅ Rollback terminé!"