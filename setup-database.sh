#!/bin/bash

# Script de configuration de la base de données
# Usage: ./setup-database.sh [development|production]

set -e

ENVIRONMENT=${1:-development}
DB_NAME="hrapp"
DB_USER="hrapp"

echo "🗃️  Configuration de la base de données pour l'environnement: $ENVIRONMENT"

# Génération d'un mot de passe sécurisé pour la production
if [ "$ENVIRONMENT" = "production" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
else
    DB_PASSWORD="dev_password_123"
fi

echo "📝 Paramètres de la base de données:"
echo "   Nom: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo "   Mot de passe: [généré automatiquement]"

# Vérification de PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL n'est pas installé"
    echo "📋 Installation sur Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "📋 Installation sur CentOS/RHEL: sudo dnf install postgresql-server postgresql-contrib"
    exit 1
fi

# Création de l'utilisateur et de la base de données
echo "🔨 Création de l'utilisateur et de la base de données..."

# Vérification si l'utilisateur existe déjà
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo "ℹ️  L'utilisateur $DB_USER existe déjà"
else
    sudo -u postgres createuser -P $DB_USER
fi

# Vérification si la base de données existe déjà
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "ℹ️  La base de données $DB_NAME existe déjà"
else
    sudo -u postgres createdb -O $DB_USER $DB_NAME
fi

# Installation de l'extension pgcrypto
echo "🔧 Installation de l'extension pgcrypto..."
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Configuration des permissions
echo "🔐 Configuration des permissions..."
sudo -u postgres psql -d $DB_NAME << EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

# Affichage de l'URL de connexion
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "✅ Base de données configurée avec succès !"
echo "📋 URL de connexion: $DATABASE_URL"
echo ""
echo "💡 Ajoutez cette ligne à votre fichier .env.$ENVIRONMENT :"
echo "DATABASE_URL=$DATABASE_URL"