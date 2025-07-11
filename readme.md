# sssdwnld v2

**sssdwnld** est un service web moderne et performant pour télécharger des vidéos depuis une multitude de plateformes, simplement en collant un lien.

## ✨ Fonctionnalités

-   **Backend Robuste** : Node.js/Express, sécurisé avec Helmet et optimisé pour la production.
-   **Frontend Réactif** : Vue.js 3 avec Vite, gestion d'état avec Pinia, et UI moderne avec Tailwind CSS.
-   **Performances** : Mise en cache des réponses avec Redis pour une rapidité fulgurante.
-   **Déploiement Simplifié** : Entièrement conteneurisé avec Docker et Docker Compose.
-   **Sécurité** : Reverse proxy avec Nginx, certificats SSL automatiques via Let's Encrypt.
-   **Monitoring** : Endpoints de santé (`/health`) et de statistiques (`/stats`).

## 🚀 Démarrage Rapide

### Prérequis

-   Node.js >= 18
-   Docker & Docker Compose

### Installation locale

1.  Clonez le dépôt :
    ```bash
    git clone [URL_DU_REPO] sssdwnld && cd sssdwnld
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Créez le fichier d'environnement pour le backend :
    ```bash
    cp packages/backend/.env.example packages/backend/.env
    ```
4.  Lancez les serveurs de développement :
    ```bash
    npm run dev
    ```
    -   Frontend disponible sur `http://localhost:5173`
    -   Backend disponible sur `http://localhost:3000`

### Déploiement en Production avec Docker

1.  Assurez-vous que votre DNS pointe vers l'IP de votre serveur.
2.  Modifiez `docker-compose.yml` et `nginx.conf` avec votre nom de domaine.
3.  Lancez Docker Compose :
    ```bash
    docker-compose up --build -d
    ```

Le site sera accessible via `http` et `https`. Les certificats SSL seront gérés automatiquement.

## 🛠️ Structure du Projet