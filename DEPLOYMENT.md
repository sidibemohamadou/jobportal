# Guide de Déploiement - Application HR

Ce guide explique comment déployer l'application sur un VPS CentOS et comment la démarrer en local.

## 🚀 Déploiement Automatique sur CentOS

### Prérequis
- VPS CentOS 7/8/9 avec accès root
- Connexion internet

### Déploiement en une commande
```bash
# Sur votre VPS CentOS (en tant que root)
chmod +x deploy-centos.sh
./deploy-centos.sh production
```

Le script va automatiquement :
- ✅ Installer Node.js 20, PostgreSQL 16, Nginx
- ✅ Configurer le firewall et les services
- ✅ Créer la base de données et l'utilisateur
- ✅ Déployer l'application
- ✅ Configurer systemd et Nginx
- ✅ Démarrer tous les services

### Après le déploiement

1. **Accès à l'application**: `http://votre-ip/`
2. **Configuration SSL** (recommandé):
   ```bash
   certbot --nginx -d votre-domaine.com
   ```
3. **Logs des services**:
   ```bash
   journalctl -u hrapp -f
   tail -f /var/log/nginx/hrapp_access.log
   ```

## 💻 Développement Local

### Configuration initiale

1. **Clonez le projet** (si pas déjà fait)
2. **Installez PostgreSQL** localement
3. **Configurez la base de données**:
   ```bash
   ./setup-database.sh development
   ```
4. **Créez votre fichier d'environnement**:
   ```bash
   cp .env.template .env.development
   # Éditez .env.development avec vos paramètres
   ```

### Démarrage en développement
```bash
./start-dev.sh
```

L'application sera disponible sur `http://localhost:5000`

## 🏭 Production Locale

### Configuration
```bash
cp .env.template .env.production
# Éditez .env.production avec vos paramètres de production
```

### Démarrage
```bash
./start-prod.sh
```

## 📋 Variables d'Environnement

### Obligatoires
- `DATABASE_URL`: URL de connexion PostgreSQL
- `SESSION_SECRET`: Secret pour les sessions (générez avec `openssl rand -base64 64`)

### Optionnelles
- `PORT`: Port d'écoute (défaut: 5000)
- `NODE_ENV`: Environnement (development/production)
- `LOG_LEVEL`: Niveau de logs (debug/info/warn/error)
- `PGSSL`: Utiliser SSL pour PostgreSQL (true/false)

## 🔧 Maintenance

### Mise à jour de l'application
```bash
# Sur le VPS
cd /opt/hrapp
git pull
sudo -u hrapp npm ci --production
sudo -u hrapp npm run build
sudo -u hrapp npm run db:push
systemctl restart hrapp
```

### Sauvegarde de la base de données
```bash
pg_dump -U hrapp hrapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restauration
```bash
psql -U hrapp hrapp < backup_file.sql
```

## 🛠️ Dépannage

### L'application ne démarre pas
```bash
journalctl -u hrapp -n 50
```

### Problèmes de base de données
```bash
sudo -u postgres psql -c "SELECT version();"
systemctl status postgresql-16
```

### Problèmes Nginx
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

## 📁 Structure des Fichiers

```
├── deploy-centos.sh          # Script de déploiement automatique
├── start-dev.sh             # Démarrage développement
├── start-prod.sh            # Démarrage production locale
├── setup-database.sh        # Configuration base de données
├── .env.template            # Template des variables d'environnement
├── nginx.conf.template      # Configuration Nginx
├── hrapp.service.template   # Service systemd
└── DEPLOYMENT.md           # Ce guide
```

## 🔐 Sécurité

- Les mots de passe sont générés automatiquement en production
- Nginx est configuré avec des headers de sécurité
- Le service tourne avec un utilisateur dédié
- PostgreSQL est configuré avec des permissions minimales
- SSL/TLS peut être facilement configuré avec Certbot

## 📞 Support

Pour les problèmes de déploiement, vérifiez :
1. Les logs de l'application: `journalctl -u hrapp -f`
2. Les logs Nginx: `/var/log/nginx/hrapp_error.log`
3. L'état des services: `systemctl status hrapp nginx postgresql-16`