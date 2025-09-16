#!/bin/bash

# Script de déploiement automatique JobPortal sur CentOS
# Usage: sudo ./deploy-centos.sh [production|staging]

set -euo pipefail

# -------------------------------
# Configuration
# -------------------------------
APP_NAME="hrapp"
APP_USER="hrapp"
APP_DIR="/opt/hrapp"
SERVICE_NAME="hrapp"
DB_NAME="hrapp"
DB_USER="hrapp"
NODE_VERSION="20"

# Couleurs pour logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }

# -------------------------------
# Vérification des droits root
# -------------------------------
if [[ $EUID -ne 0 ]]; then
   error "Ce script doit être exécuté en tant que root"
fi

ENVIRONMENT=${1:-production}
log "Déploiement en mode: $ENVIRONMENT"

# -------------------------------
# Mise à jour du système
# -------------------------------
log "Mise à jour du système..."
dnf update -y || yum update -y

# -------------------------------
# Installation de Node.js
# -------------------------------
log "Installation de Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    dnf install -y nodejs || yum install -y nodejs
fi

# -------------------------------
# Installation des dépendances système
# -------------------------------
log "Installation des dépendances système..."
dnf install -y git curl wget firewalld nginx certbot python3-certbot-nginx || \
yum install -y git curl wget firewalld nginx certbot python3-certbot-nginx

# -------------------------------
# Configuration du firewall
# -------------------------------
log "Configuration du firewall..."
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# -------------------------------
# Création de l'utilisateur et des répertoires
# -------------------------------
log "Création de l'utilisateur $APP_USER..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $APP_DIR $APP_USER
fi

log "Création des répertoires..."
mkdir -p $APP_DIR /var/log/$APP_NAME
chown -R $APP_USER:$APP_USER $APP_DIR /var/log/$APP_NAME

# -------------------------------
# Configuration PostgreSQL
# -------------------------------
log "Configuration de PostgreSQL..."
DB_PASSWORD=$(openssl rand -base64 32)

sudo -u postgres psql << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;

DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
      CREATE DATABASE $DB_NAME OWNER $DB_USER;
   END IF;
END
\$\$;
EOF

# -------------------------------
# Déploiement du code
# -------------------------------
log "Déploiement du code..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    sudo -u $APP_USER git pull
else
    sudo -u $APP_USER git clone https://github.com/sidibemohamadou/jobportal.git $APP_DIR
fi

cd $APP_DIR

# -------------------------------
# Configuration des secrets et .env
# -------------------------------
log "Génération des secrets..."
SESSION_SECRET=$(openssl rand -base64 64)

log "Création du fichier d'environnement..."
cat > /etc/$APP_NAME.env << EOF
NODE_ENV=$ENVIRONMENT
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
PGSSL=false
TZ=Europe/Paris
LOG_LEVEL=info
EOF
chmod 600 /etc/$APP_NAME.env

# -------------------------------
# Installation Node.js / build
# -------------------------------
log "Installation des dépendances Node.js..."
sudo -u $APP_USER npm ci

log "Build de l'application..."
sudo -u $APP_USER npm run build

log "Application des migrations..."
sudo -u $APP_USER bash -c "source /etc/$APP_NAME.env && npm run db:push"

sudo -u $APP_USER npm prune --omit=dev

# -------------------------------
# Configuration systemd
# -------------------------------
log "Configuration du service systemd..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=HR Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/$APP_NAME.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$APP_NAME
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$APP_DIR /var/log/$APP_NAME

[Install]
WantedBy=multi-user.target
EOF

# -------------------------------
# Configuration Nginx
# -------------------------------
log "Configuration de Nginx..."
cat > /etc/nginx/conf.d/$APP_NAME.conf << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
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
systemctl enable nginx
systemctl restart nginx

# -------------------------------
# Démarrage du service
# -------------------------------
log "Démarrage des services..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

# -------------------------------
# Vérification
# -------------------------------
log "Vérification du statut des services..."
systemctl status $SERVICE_NAME --no-pager
systemctl status nginx --no-pager

log "=== DÉPLOIEMENT TERMINÉ ==="
echo "Base de données: postgresql://$DB_USER:***@localhost:5432/$DB_NAME"
echo "Configuration: /etc/$APP_NAME.env"
echo "Logs: journalctl -u $SERVICE_NAME -f"
echo "Application: http://votre-ip/"
echo "🔐 IMPORTANT: Le mot de passe de la base de données est stocké dans /etc/$APP_NAME.env"
log "✅ Déploiement terminé avec succès !"
