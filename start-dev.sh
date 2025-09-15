#!/bin/bash

# Script de démarrage pour le développement local
# Usage: ./start-dev.sh

set -e

echo "🚀 Démarrage de l'application en mode développement..."

# Vérification des fichiers nécessaires
if [ ! -f ".env.development" ]; then
    echo "❌ Fichier .env.development manquant"
    echo "📋 Copiez .env.template vers .env.development et configurez vos variables:"
    echo "   cp .env.template .env.development"
    echo "   # Puis éditez .env.development avec vos informations"
    exit 1
fi

# Chargement des variables d'environnement
echo "📝 Chargement des variables d'environnement..."
set -a
source .env.development
set +a

# Vérification de la base de données
if [ -n "$DATABASE_URL" ]; then
    echo "🗃️  Base de données: $DATABASE_URL"
else
    echo "❌ DATABASE_URL non définie dans .env.development"
    exit 1
fi

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Application des migrations
echo "🔄 Application des migrations de base de données..."
npm run db:push

# Démarrage de l'application
echo "🌟 Démarrage de l'application sur le port $PORT..."
echo "📱 Application disponible sur: http://localhost:$PORT"
echo "🛑 Appuyez sur Ctrl+C pour arrêter"
echo ""

npm run dev