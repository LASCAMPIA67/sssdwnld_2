#!/bin/bash
# scripts/monitor.sh - CRÉER CE FICHIER

# Monitoring en temps réel
echo "📊 Monitoring sssdwnld..."

# Fonction pour afficher les métriques
show_metrics() {
    clear
    echo "=== SSSDWNLD MONITORING ==="
    echo "Date: $(date)"
    echo ""
    
    # Status PM2
    echo "📦 PM2 Status:"
    pm2 list
    echo ""
    
    # Utilisation CPU/RAM
    echo "💻 Ressources système:"
    top -bn1 | grep "Cpu\|Mem" | head -2
    echo ""
    
    # Status Redis
    echo "🔴 Redis:"
    redis-cli ping
    redis-cli info stats | grep "instantaneous_ops_per_sec"
    echo ""
    
    # Dernières requêtes
    echo "📝 Dernières requêtes API:"
    tail -5 /var/log/nginx/sssdwnld_access.log | grep "/api/"
    echo ""
    
    # Erreurs récentes
    echo "❌ Erreurs récentes:"
    tail -5 logs/error.log 2>/dev/null || echo "Pas d'erreurs"
    echo ""
    
    # Espace disque
    echo "💾 Espace disque:"
    df -h | grep -E "^/dev/"
}

# Boucle de monitoring
while true; do
    show_metrics
    sleep 5
done