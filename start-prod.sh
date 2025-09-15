#!/bin/bash

# Script de démarrage pour la production locale
# Usage: ./start-prod.sh

set -e

echo "🏭 Démarrage de l'application en mode production..."

# Vérification des fichiers nécessaires
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant"
    echo "📋 Copiez .env.template vers .env.production et configurez vos variables:"
    echo "   cp .env.template .env.production"
    echo "   # Puis éditez .env.production avec vos informations"
    exit 1
fi

# Chargement des variables d'environnement
echo "📝 Chargement des variables d'environnement..."
set -a
source .env.production
set +a

# Vérification de la base de données
if [ -n "$DATABASE_URL" ]; then
    echo "🗃️  Base de données: ${DATABASE_URL%@*}@***"
else
    echo "❌ DATABASE_URL non définie dans .env.production"
    exit 1
fi

# Installation des dépendances de production
echo "📦 Installation des dépendances de production..."
npm ci --production

# Application des migrations
echo "🔄 Application des migrations de base de données..."
npm run db:push

# Build de l'application
echo "🏗️  Build de l'application..."
npm run build

# Vérification du build
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build échoué - dist/index.js non trouvé"
    exit 1
fi

# Démarrage de l'application
echo "🌟 Démarrage de l'application sur le port $PORT..."
echo "📱 Application disponible sur: http://localhost:$PORT"
echo "📊 Logs: tail -f logs/app.log (si configuré)"
echo "🛑 Appuyez sur Ctrl+C pour arrêter"
echo ""

npm start