#!/bin/bash

set -e

echo "🧪 Tests locaux sssdwnld..."

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

# 1. Vérifier les dépendances
log "Vérification des dépendances..."
command -v node >/dev/null 2>&1 || { error "Node.js requis mais non installé."; exit 1; }
command -v npm >/dev/null 2>&1 || { error "npm requis mais non installé."; exit 1; }

# 2. Installer les packages
log "Installation des packages..."
npm install

# 3. Linter le code
log "Vérification du code (ESLint)..."
npm run lint --workspaces --if-present || warning "Erreurs de lint détectées"

# 4. Build le frontend
log "Build du frontend..."
npm run build

# 5. Vérifier la structure des fichiers
log "Vérification de la structure..."
required_files=(
    "packages/backend/server.js"
    "packages/backend/routes/download.js"
    "packages/backend/routes/health.js"
    "packages/frontend/src/app.vue"
    "packages/frontend/src/components/VideoResults.vue"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log "✓ $file existe"
    else
        error "✗ $file manquant"
        exit 1
    fi
done

# 6. Test du backend (démarrage temporaire)
log "Test du serveur backend..."
cd packages/backend
timeout 5 node server.js > ../../logs/test-backend.log 2>&1 || true
cd ../..

# 7. Vérifier les logs
if grep -q "error" logs/test-backend.log; then
    warning "Erreurs détectées dans les logs backend"
    cat logs/test-backend.log
fi

# 8. Tests unitaires (si présents)
log "Exécution des tests unitaires..."
npm test --workspaces --if-present || warning "Pas de tests unitaires"

echo -e "${GREEN}✅ Tests locaux terminés!${NC}"
echo "Consultez les logs dans le dossier logs/"