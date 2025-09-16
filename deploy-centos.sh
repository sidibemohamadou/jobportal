#!/bin/bash

echo "💼 Déploiement Serveur avec PostgreSQL - JobPortal"
echo "================================================="
echo "📋 Système détecté: CentOS 10 Stream"
echo ""

# Variables de configuration
APP_NAME="jobportal"
APP_DIR="/var/www/$APP_NAME"
SERVICE_USER="nginx"
NGINX_CONF_DIR="/etc/nginx/conf.d"
DB_NAME="jobportal_db"
DB_USER="jobportal_user"
DB_PASSWORD="jobportal_secure_password_2025"

# Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script doit être exécuté en tant que root (sudo)"
    echo "Usage: sudo ./deploy-jobportal.sh"
    exit 1
fi

echo "🔄 Mise à jour du système..."
dnf update -y

echo "📦 Installation des dépendances système..."
dnf install -y curl git nginx postgresql postgresql-server postgresql-contrib

# Installer Node.js 18+ si nécessaire
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js..."
    dnf module install -y nodejs:18/common
fi

echo "✅ Node.js $(node -v) installé"

# Installer PM2 si nécessaire
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installation de PM2..."
    npm install -g pm2
fi

echo "🗄️ Configuration de PostgreSQL..."
# Initialiser PostgreSQL si nécessaire
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
    echo "🔧 Initialisation de PostgreSQL..."
    postgresql-setup --initdb || echo "⚠️ PostgreSQL déjà initialisé"
fi

# Démarrer et activer PostgreSQL
systemctl start postgresql
systemctl enable postgresql

echo "🗄️ Configuration de la base de données..."
# Créer la base de données et l'utilisateur
sudo -u postgres psql << EOF
-- Créer l'utilisateur
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Créer la base de données
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Se connect
