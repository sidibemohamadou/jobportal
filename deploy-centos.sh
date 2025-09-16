#!/bin/bash

# Déploiement JobPortal sur CentOS 10 avec PM2 et PostgreSQL
set -e

APP_NAME="jobportal"
APP_DIR="/var/www/$APP_NAME"
DB_NAME="jobportal"
DB_USER="jobportal_user"
DB_PASSWORD="jobportal_password"
PORT=5001
SERVICE_USER="nginx"

echo "🚀 Déploiement de $APP_NAME"

# Vérifier root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Lancez le script en root (sudo)"
  exit 1
fi

# Installer dépendances système
echo "📦 Installation des dépendances..."
dnf install -y curl git nginx postgresql postgresql-server postgresql-contrib nodejs npm

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé"
    exit 1
fi
echo "✅ Node.js $(node -v) installé"

# Installer PM2 globalement
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Créer répertoire d'app
mkdir -p $APP_DIR
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Cloner ou mettre à jour JobPortal
cd $APP_DIR
if [ -d ".git" ]; then
    sudo -u $SERVICE_USER git pull
else
    sudo -u $SERVICE_USER git clone https://github.com/sidibemohamadou/jobportal.git $APP_DIR
fi

# Installer dépendances Node
sudo -u $SERVICE_USER npm install

# Build de l'application
sudo -u $SERVICE_USER npm run build

# Créer fichier d'environnement
cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=$PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF
chown $SERVICE_USER:$SERVICE_USER $APP_DIR/.env

# Créer fichier PM2 compatible ESM
cat > $APP_DIR/ecosystem.config.mjs << EOF
export default {
  apps: [
    {
      name: "$APP_NAME",
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: $PORT
      }
    }
  ]
}
EOF
chown $SERVICE_USER:$SERVICE_USER $APP_DIR/ecosystem.config.mjs

# Lancer l'application avec PM2
sudo -u $SERVICE_USER pm2 stop $APP_NAME || true
sudo -u $SERVICE_USER pm2 delete $APP_NAME || true
sudo -u $SERVICE_USER pm2 start $APP_DIR/ecosystem.config.mjs --name $APP_NAME
sudo -u $SERVICE_USER pm2 save

# Configurer Nginx pour reverse proxy sur 5001
cat > /etc/nginx/conf.d/$APP_NAME.conf << EOF
server {
    listen $PORT;
    server_name _;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

nginx -t
systemctl restart nginx

echo "✅ Déploiement terminé !"
echo "🔗 Accès à l'application : http://$(hostname -I | awk '{print $1}'):$PORT"
echo "📄 Logs PM2 : sudo -u $SERVICE_USER pm2 logs $APP_NAME"
