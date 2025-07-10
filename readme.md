# sssdwnld 🎥

**sssdwnld** est un service web moderne et performant pour télécharger des vidéos et des audios depuis une multitude de plateformes (YouTube, TikTok, Twitter/X, etc.) en collant simplement une URL.

**Créé par LASCAMPIA**

[![Build and Deploy](https://github.com/LASCAMPIA67/sssdwnld_2/actions/workflows/deploy.yml/badge.svg)](https://github.com/LASCAMPIA67/sssdwnld_2/actions/workflows/deploy.yml)

## 🚀 Fonctionnalités Clés

- ✅ **Support Multi-plateformes** : Plus de 100 sites supportés grâce à `yt-dlp`.
- ⚡ **Interface Ultra-Réactive** : Frontend construit avec Vue.js 3, Vite et Tailwind CSS.
- 💪 **API Robuste** : Backend en Node.js/Express, sécurisé et performant.
- 📊 **Métadonnées Complètes** : Affiche titre, miniature, durée, vues, etc.
- 🎯 **Formats Multiples** : Propose des formats vidéo et audio séparés avec différentes qualités.
- 📱 **Entièrement Responsive** : Expérience utilisateur optimale sur mobile, tablette et desktop.
- 🛡️ **Sécurisé** : Rate limiting, headers de sécurité (Helmet), CORS stricts, et déploiement conteneurisé.
- 🐳 **Prêt pour le Cloud** : Déploiement facile avec Docker et automatisation via GitHub Actions.

## 🏗️ Architecture Technique

Ce projet est un **monorepo** géré avec les workspaces `npm`.

- `packages/frontend`: Application client en Vue.js 3.
- `packages/backend`: API REST en Node.js et Express.
- `Dockerfile`: Configuration pour créer une image Docker optimisée et sécurisée.
- `.github/workflows`: CI/CD pour le déploiement automatisé.

### Stack Technique

- **Backend**: Node.js, Express, Winston, `yt-dlp-wrap`, Helmet
- **Frontend**: Vue.js 3 (Composition API), Vite, Pinia, Tailwind CSS, Axios
- **Déploiement**: Docker, Nginx (en reverse proxy), PM2 (alternative à Docker)
- **Tests**: Jest, Supertest

## 📦 Installation & Déploiement

### 1. Déploiement avec Docker (Recommandé)

C'est la méthode la plus simple et la plus sécurisée pour la production.

**Prérequis** :

- Docker & Docker Compose installés sur votre serveur.
- Nginx installé pour servir de reverse proxy.

**Étapes** :

1. Clonez le dépôt sur votre serveur :

    ```bash
    git clone [https://github.com/LASCAMPIA67/sssdwnld_2.git](https://github.com/LASCAMPIA67/sssdwnld_2.git)
    cd sssdwnld_2
    ```

2. Créez le fichier de configuration Nginx (par exemple `/etc/nginx/sites-available/sssdwnld.com`) :
    *(Voir le `nginx.conf` fourni dans le projet pour une configuration complète avec SSL)*

3. Lancez l'application avec Docker Compose :

    ```bash
    docker-compose up -d
    ```

### 2. Installation Locale (Pour le développement)

**Prérequis** :

- Node.js >= 18.0
- npm >= 9.0

**Étapes** :

1. Clonez le dépôt :

    ```bash
    git clone [https://github.com/LASCAMPIA67/sssdwnld_2.git](https://github.com/LASCAMPIA67/sssdwnld_2.git)
    cd sssdwnld_2
    ```

2. Créez un fichier `.env` dans `packages/backend/` en vous basant sur `.env.example`.

3. Installez toutes les dépendances :

    ```bash
    npm run install:all
    ```

4. Lancez les serveurs de développement :

    ```bash
    npm run dev
    ```

    - Frontend : `http://localhost:5173`
    - Backend : `http://localhost:3000`

### Scripts Utiles

- `npm run dev`: Lance le backend et le frontend en mode développement.
- `npm run build`: Build le frontend pour la production.
- `npm run start`: Lance le serveur backend en mode production.
- `npm test`: Lance les tests pour tous les workspaces.
- `npm run lint`: Analyse et corrige les erreurs de style du code.

## 📡 Documentation de l'API

### `POST /api/v1/download`

Récupère les métadonnées et les formats disponibles pour une URL de vidéo donnée.

- **Body** (`application/json`):

    ```json
    {
      "url": "[https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
    }
    ```

- **Réponse Succès (200 OK)**:

    ```json
    {
      "success": true,
      "metadata": { /* ... */ },
      "formats": {
        "video": [ /* ... */ ],
        "audio": [ /* ... */ ]
      }
    }
    ```

- **Réponse Erreur (4xx/5xx)**:

    ```json
    {
      "error": true,
      "message": "Description de l'erreur."
    }
    ```

### `GET /api/v1/health`

Vérifie l'état de santé de l'API et de ses dépendances (comme `yt-dlp`).

- **Réponse Succès (200 OK)**:

    ```json
    {
      "status": "ok",
      "timestamp": "...",
      "ytdlp": "2023.12.30"
    }
    ```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour des changements majeurs, veuillez d'abord ouvrir une "issue" pour en discuter.

1. Fork le projet.
2. Créez votre branche (`git checkout -b feature/AmazingFeature`).
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`).
4. Pushez sur la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

## 📝 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.
