#!/bin/bash

set -e

echo "🔧 Installation initiale de sssdwnld..."

# Installer yt-dlp
echo "📥 Installation de yt-dlp..."
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

# Créer les dossiers nécessaires
echo "📁 Création des dossiers..."
mkdir -p /var/log/nginx
mkdir -p /var/www/sssdwnld_2/logs

# Configurer Redis
echo "⚙️ Configuration de Redis..."
sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl restart redis-server

# Configurer les limites système
echo "⚙️ Configuration des limites système..."
cat >> /etc/security/limits.conf <<EOF
* soft nofile 65536
* hard nofile 65536
EOF

# Optimisation sysctl
cat >> /etc/sysctl.conf <<EOF
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_syn_backlog = 3240
net.ipv4.tcp_max_tw_buckets = 1440000
net.ipv4.ip_local_port_range = 10000 65000
EOF
sysctl -p

echo "✅ Installation initiale terminée!"