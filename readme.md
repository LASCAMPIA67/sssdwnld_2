# sssdwnld_2 🎥

Service web moderne et performant pour télécharger des vidéos depuis une multitude de plateformes (YouTube, Twitter, TikTok, Facebook, Instagram, etc.) en collant simplement une URL.

**Créé par LASCAMPIA**

## 🚀 Fonctionnalités

- ✅ Support de 100+ plateformes vidéo
- ⚡ Interface moderne et réactive (Vue.js 3 + Tailwind CSS)
- 🔄 API REST performante (Node.js + Express)
- 📊 Métadonnées complètes (titre, durée, vues, miniature)
- 🎯 Formats multiples (vidéo + audio)
- 📱 Design entièrement responsive
- 🔒 Limitation du taux de requêtes intégrée
- 🚀 Déploiement automatisé avec GitHub Actions

## 🏗️ Architecture Technique

### Structure Monorepo
```
sssdwnld_2/
├── packages/
│   ├── backend/     # API Node.js/Express
│   └── frontend/    # Application Vue.js 3
├── package.json     # Configuration des workspaces npm
└── ecosystem.config.js  # Configuration PM2
```

### Stack Technique

**Backend:**
- Node.js 16+
- Express.js
- yt-dlp-wrap (wrapper Node.js pour yt-dlp)
- Helmet (sécurité)
- CORS
- Express Rate Limit

**Frontend:**
- Vue.js 3 (Composition API)
- Vite
- Tailwind CSS
- Axios

## 📦 Installation

### Prérequis
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### Installation locale

1. Cloner le dépôt
```bash
git clone https://github.com/LASCAMPIA67/sssdwnld_2.git
cd sssdwnld_2
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer en mode développement
```bash
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend : http://localhost:3000

### Scripts disponibles

```bash
# Développement
npm run dev              # Lance frontend + backend
npm run dev:frontend     # Lance uniquement le frontend
npm run dev:backend      # Lance uniquement le backend

# Production
npm run build           # Build le frontend
npm run start           # Lance le backend en production
```

## 📡 Documentation API

### Endpoint principal

#### POST `/api/v1/download`

Analyse une URL vidéo et retourne les métadonnées et formats disponibles.

**Requête:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Réponse:**
```json
{
  "success": true,
  "metadata": {
    "title": "Titre de la vidéo",
    "duration": 212,
    "thumbnail": "https://...",
    "description": "Description...",
    "uploader": "Nom du créateur",
    "view_count": 1234567,
    "upload_date": "20240115",
    "webpage_url": "https://..."
  },
  "formats": {
    "video": [
      {
        "format_id": "137",
        "quality": "1080p",
        "ext": "mp4",
        "filesize": 123456789,
        "url": "https://...",
        "resolution": "1920x1080",
        "fps": 30,
        "vcodec": "avc1.640028",
        "acodec": "mp4a.40.2"
      }
    ],
    "audio": [
      {
        "format_id": "140",
        "quality": "128kbps",
        "ext": "m4a",
        "filesize": 3456789,
        "url": "https://...",
        "acodec": "mp4a.40.2"
      }
    ]
  }
}
```

### Autres endpoints

- `GET /api/v1/health` - Vérification de l'état du service
- `GET /api/v1/download/direct` - Téléchargement direct (documentation)

## 🚀 Déploiement

### Configuration du serveur VPS

1. Connectez-vous au serveur :
```bash
ssh root@147.79.101.66
```

2. Installez les prérequis :
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# Nginx
sudo apt-get install -y nginx

# Git
sudo apt-get install -y git
```

3. Clonez le projet :
```bash
cd /var/www
git clone https://github.com/LASCAMPIA67/sssdwnld_2.git
cd sssdwnld_2
```

4. Installez les dépendances et buildez :
```bash
npm install
npm run build
```

5. Configurez Nginx (voir section suivante)

6. Lancez avec PM2 :
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### GitHub Actions

Le déploiement automatique est configuré via GitHub Actions. À chaque push sur `main`, le workflow :
1. Se connecte au VPS via SSH
2. Pull les derniers changements
3. Installe les dépendances
4. Build le frontend
5. Redémarre le backend avec PM2

## 🔧 Configuration avancée

### Variables d'environnement

Créez un fichier `.env` dans `/packages/backend/` :
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://votre-domaine.com
```

### Limitation du taux

Par défaut : 100 requêtes par IP toutes les 15 minutes. Modifiable dans `server.js`.

## 📝 Licence

MIT - Créé par LASCAMPIA

## 🤝 Contribution

Les pull requests sont les bienvenues. Pour des changements majeurs, ouvrez d'abord une issue.

## 🐛 Support

Pour tout problème ou question, ouvrez une issue sur GitHub.