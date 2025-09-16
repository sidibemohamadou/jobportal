#!/bin/bash

echo "🚀 Déploiement JobPortal sur CentOS 10 Stream"
echo "============================================="
echo ""

# Variables de configuration
APP_NAME="jobportal"
APP_DIR="/var/www/$APP_NAME"
SERVICE_USER="nginx"
NGINX_CONF_DIR="/etc/nginx/conf.d"
DB_NAME="jobportal"
DB_USER="jobportal_user"
DB_PASSWORD="jobportal_secure_password_2025"
APP_PORT=5001

# Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

echo "🔄 Mise à jour du système..."
dnf update -y

echo "📦 Installation des dépendances système..."
dnf install -y curl git nginx postgresql postgresql-server postgresql-contrib

# Installer Node.js 20+
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js..."
    dnf module install -y nodejs:20/common
fi
echo "✅ Node.js $(node -v) installé"

# Installer PM2 si absent
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "🗄️ Configuration de PostgreSQL..."
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
    echo "🔧 Initialisation de PostgreSQL..."
    sudo -u postgres /usr/bin/initdb -D /var/lib/pgsql/data
fi
systemctl start postgresql
systemctl enable postgresql

echo "🗄️ Création de la base de données et de l'utilisateur..."
sudo -u postgres psql << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

-- Créer la base si elle n'existe pas
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
      CREATE DATABASE $DB_NAME OWNER $DB_USER;
   END IF;
END
\$\$;
EOF

echo "📁 Création du répertoire de l'application..."
mkdir -p $APP_DIR
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

echo "📂 Clone du projet JobPortal depuis GitHub..."
cd /tmp
rm -rf jobportal
git clone https://github.com/sidibemohamadou/jobportal.git
cp -r jobportal/* $APP_DIR/
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

cd $APP_DIR

echo "📦 Installation des dépendances Node.js..."
sudo -u $SERVICE_USER npm install

echo "🏗️ Build de l'application..."
sudo -u $SERVICE_USER npm run build

echo "⚙️ Création du fichier d'environnement..."
cat > .env << EOF
NODE_ENV=production
PORT=$APP_PORT
SESSION_SECRET=jobportal-secret-key-2025
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
APP_NAME="JobPortal"
EOF
chown $SERVICE_USER:$SERVICE_USER .env

echo "🔧 Configuration de Nginx sur le port $APP_PORT..."
cat > $NGINX_CONF_DIR/$APP_NAME.conf << EOF
server {
    listen $APP_PORT;
    server_name _;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

nginx -t
systemctl restart nginx
systemctl enable nginx

echo "🚀 Démarrage de l'application avec PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF
chown $SERVICE_USER:$SERVICE_USER ecosystem.config.js

sudo -u $SERVICE_USER pm2 stop $APP_NAME 2>/dev/null || true
sudo -u $SERVICE_USER pm2 delete $APP_NAME 2>/dev/null || true
sudo -u $SERVICE_USER pm2 start ecosystem.config.js
sudo -u $SERVICE_USER pm2 save

echo ""
echo "🎉 Déploiement terminé !"
echo "💻 Accès à JobPortal via : http://$(hostname -I | awk '{print $1}'):$APP_PORT"
echo "📋 Base de données : postgresql://$DB_USER:***@localhost:5432/$DB_NAME"
