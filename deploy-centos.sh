#!/bin/bash

# Script de déploiement automatique pour CentOS 7/8/9
# Usage: ./deploy-centos.sh [production|staging]

set -euo pipefail

# Configuration
APP_NAME="hrapp"
APP_USER="hrapp"
APP_DIR="/opt/hrapp"
SERVICE_NAME="hrapp"
DB_NAME="hrapp"
DB_USER="hrapp"
NODE_VERSION="20"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Vérification des droits root
if [[ $EUID -ne 0 ]]; then
   error "Ce script doit être exécuté en tant que root"
fi

# Environnement (par défaut production)
ENVIRONMENT=${1:-production}
log "Déploiement en mode: $ENVIRONMENT"

# Mise à jour du système
log "Mise à jour du système..."
dnf update -y || yum update -y

# Installation de Node.js via NodeSource
log "Installation de Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    dnf install -y nodejs || yum install -y nodejs
fi

# Installation de PostgreSQL 16
log "Installation de PostgreSQL..."
if ! command -v psql &> /dev/null; then
    dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm || \
    yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
    
    dnf install -y postgresql16-server postgresql16 || yum install -y postgresql16-server postgresql16
    
    # Initialisation de PostgreSQL
    /usr/pgsql-16/bin/postgresql-16-setup initdb
    systemctl enable postgresql-16
    systemctl start postgresql-16
fi

# Installation d'autres dépendances
log "Installation des dépendances système..."
dnf install -y git curl wget firewalld nginx certbot python3-certbot-nginx || \
yum install -y git curl wget firewalld nginx certbot python3-certbot-nginx

# Configuration du firewall
log "Configuration du firewall..."
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --reload

# Création de l'utilisateur application
log "Création de l'utilisateur $APP_USER..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $APP_DIR $APP_USER
fi

# Création des répertoires
log "Création des répertoires..."
mkdir -p $APP_DIR
mkdir -p /var/log/$APP_NAME
chown $APP_USER:$APP_USER $APP_DIR
chown $APP_USER:$APP_USER /var/log/$APP_NAME

# Configuration de la base de données
log "Configuration de PostgreSQL..."
DB_PASSWORD=$(openssl rand -base64 32)

# Modification de pg_hba.conf pour autoriser les connexions locales
PG_HBA="/var/lib/pgsql/16/data/pg_hba.conf"
if ! grep -q "local.*$DB_NAME.*$DB_USER.*md5" $PG_HBA; then
    sed -i "/^local.*all.*all.*peer/i local   $DB_NAME    $DB_USER                                md5" $PG_HBA
    systemctl restart postgresql-16
fi

# Création de la base de données et de l'utilisateur
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
sudo -u postgres psql << EOF
CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# Clonage ou mise à jour du code
log "Déploiement du code..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    sudo -u $APP_USER git pull
else
    # Si vous utilisez un repo Git, décommentez et modifiez cette ligne :
    # sudo -u $APP_USER git clone https://github.com/votre-username/votre-repo.git $APP_DIR
    
    # Pour l'instant, on copie le code depuis le répertoire courant
    if [ -f "package.json" ]; then
        cp -r . $APP_DIR/
        chown -R $APP_USER:$APP_USER $APP_DIR
    else
        error "Aucun code source trouvé. Assurez-vous d'être dans le répertoire du projet."
    fi
fi

cd $APP_DIR

# Génération des secrets
log "Génération des secrets..."
SESSION_SECRET=$(openssl rand -base64 64)

# Création du fichier d'environnement
log "Configuration des variables d'environnement..."
cat > /etc/$APP_NAME.env << EOF
NODE_ENV=$ENVIRONMENT
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
PGSSL=false

# Configuration pour la production
TZ=Europe/Paris
LOG_LEVEL=info
EOF

chmod 600 /etc/$APP_NAME.env

# Installation des dépendances Node.js
log "Installation des dépendances Node.js..."
sudo -u $APP_USER npm ci --production

# Application des migrations de base de données
log "Application des migrations..."
sudo -u $APP_USER bash -c "source /etc/$APP_NAME.env && npm run db:push"

# Build de l'application
log "Build de l'application..."
sudo -u $APP_USER npm run build

# Création du service systemd
log "Configuration du service systemd..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=HR Application
After=network.target postgresql-16.service
Wants=postgresql-16.service

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

# Sécurité
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$APP_DIR /var/log/$APP_NAME

[Install]
WantedBy=multi-user.target
EOF

# Configuration de Nginx
log "Configuration de Nginx..."
cat > /etc/nginx/conf.d/$APP_NAME.conf << EOF
server {
    listen 80;
    server_name _;  # Remplacez par votre nom de domaine
    
    # Redirection vers HTTPS (décommentez après avoir configuré SSL)
    # return 301 https://\$server_name\$request_uri;
    
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

# Configuration de SELinux pour Nginx (si activé)
if command -v setsebool &> /dev/null; then
    setsebool -P httpd_can_network_connect 1
fi

# Démarrage des services
log "Démarrage des services..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

systemctl enable nginx
systemctl restart nginx

# Vérification du statut
log "Vérification du statut des services..."
systemctl status $SERVICE_NAME --no-pager
systemctl status nginx --no-pager

# Test de l'API
log "Test de l'API..."
sleep 5
if curl -s http://localhost:5000/api/jobs > /dev/null; then
    log "✅ API accessible sur http://localhost:5000"
else
    warn "❌ L'API ne répond pas sur le port 5000"
fi

if curl -s http://localhost/api/jobs > /dev/null; then
    log "✅ Application accessible via Nginx sur le port 80"
else
    warn "❌ L'application n'est pas accessible via Nginx"
fi

# Affichage des informations finales
log "=== DÉPLOIEMENT TERMINÉ ==="
echo "Base de données: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo "Configuration: /etc/$APP_NAME.env"
echo "Logs: journalctl -u $SERVICE_NAME -f"
echo "Application: http://votre-ip/"
echo ""
echo "Pour configurer SSL avec Let's Encrypt :"
echo "certbot --nginx -d votre-domaine.com"
echo ""
log "✅ Déploiement terminé avec succès !"