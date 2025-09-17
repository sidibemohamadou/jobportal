#!/bin/bash

echo "🚀 Déploiement Serveur avec PostgreSQL - Application 2"
echo "===================================================="

# Variables spécifiques à l’app 2
APP_NAME="crm-immobilier"
APP_DIR="/var/www/$APP_NAME"
SERVICE_USER="nginx"
NGINX_CONF_DIR="/etc/nginx/conf.d"
DB_NAME="crm_immobilier"
DB_USER="crm_user"
DB_PASSWORD="crm_secure_password_2024"
PORT=5001   # ⚠️ port différent de l’app 1

# Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

echo "🔄 Vérification des dépendances..."
# Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js..."
    dnf module install -y nodejs:18/common
else
    echo "✅ Node.js $(node -v) déjà installé"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installation de PM2..."
    npm install -g pm2
else
    echo "✅ PM2 déjà installé"
fi

# PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "📦 Installation & démarrage de PostgreSQL..."
    dnf install -y postgresql postgresql-server postgresql-contrib
    postgresql-setup --initdb
    systemctl enable --now postgresql
else
    echo "✅ PostgreSQL déjà actif"
fi

echo "🗄️ Configuration base de données $DB_NAME..."
sudo -u postgres psql << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
      CREATE DATABASE $DB_NAME OWNER postgres;
   END IF;
END
\$\$;

DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "📁 Création du répertoire d’application..."
mkdir -p $APP_DIR
cd /tmp
rm -rf $APP_NAME
git clone https://github.com/sidibemohamadou/$APP_NAME.git
cp -r $APP_NAME/* $APP_DIR/
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
cd $APP_DIR

echo "📦 Installation des dépendances..."
sudo -u $SERVICE_USER npm install

echo "🏗️ Build de l’application..."
sudo -u $SERVICE_USER npm run build

echo "⚙️ Variables d’environnement..."
cat > .env << EOF
NODE_ENV=production
PORT=$PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=${APP_NAME}_secret_key_2024
EOF
chown $SERVICE_USER:$SERVICE_USER .env

echo "🔧 Nginx configuration..."
cat > $NGINX_CONF_DIR/$APP_NAME.conf << EOF
server {
    listen 80;
    server_name _;

    location /$APP_NAME/ {
        proxy_pass http://localhost:$PORT/;
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

nginx -t && systemctl reload nginx

echo "🚀 PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    }
  }]
}
EOF

chown $SERVICE_USER:$SERVICE_USER ecosystem.config.js

sudo -u $SERVICE_USER pm2 stop $APP_NAME 2>/dev/null || true
sudo -u $SERVICE_USER pm2 delete $APP_NAME 2>/dev/null || true
sudo -u $SERVICE_USER pm2 start ecosystem.config.js
sudo -u $SERVICE_USER pm2 save

echo "🎉 Déploiement terminé !"
echo "🌐 Application accessible : http://$(hostname -I | awk '{print $1}')/$APP_NAME/"
