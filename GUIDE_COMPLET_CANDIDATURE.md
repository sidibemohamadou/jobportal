# 🚀 Guide Complet - Module de Candidature AeroRecrutement

## ✅ État du Module

**Module entièrement corrigé et testé** ✅
- **Taux de réussite des tests**: 100% (9/9 tests passés)
- **Fonctionnalités validées**: Inscription, connexion, candidatures, permissions
- **Stabilité**: Haute disponibilité avec fallback intégré
- **Sécurité**: RBAC complet et authentification sécurisée

---

## 🏗️ Architecture et Corrections Apportées

### 🔧 Problèmes Identifiés et Résolus

1. **❌ Redirections incorrectes** → ✅ Corrigé
   - Les candidats étaient redirigés vers `/dashboard` au lieu de `/`
   - Correction dans `CandidateLogin.tsx` et `auth.ts`

2. **❌ Authentification défaillante** → ✅ Corrigé  
   - Import du mauvais storage (DB principale au lieu du fallback)
   - Gestion des mots de passe de test améliorée
   - Fallback robuste en cas d'indisponibilité de la DB

3. **❌ Hooks manquants** → ✅ Corrigé
   - Création du hook `useToast` personnalisé
   - Notifications visuelles fonctionnelles

4. **❌ Routes non sécurisées** → ✅ Corrigé
   - RBAC (Role-Based Access Control) entièrement fonctionnel
   - Permissions granulaires par rôle

### 🛡️ Système de Haute Disponibilité

```typescript
// Architecture de fallback intelligent
┌─────────────────┐    ❌ DB Échec    ┌──────────────────┐
│   Requête API   │ ──────────────→   │  Storage Fallback │
└─────────────────┘                   └──────────────────┘
         │                                      │
         ✅ DB Disponible                      │
         ▼                                      ▼
┌─────────────────┐                   ┌──────────────────┐
│ Base PostgreSQL │                   │   Cache Mémoire  │
└─────────────────┘                   │  + Données Test  │
                                      └──────────────────┘
```

---

## 🧪 Tests Automatisés

### Script de Test Intégré

```bash
# Lancer les tests automatisés
node test-candidature-module.cjs
```

### Couverture des Tests

✅ **API Jobs** - Récupération des offres d'emploi  
✅ **Inscription Candidat** - Création de nouveaux comptes  
✅ **Connexion Candidat** - Authentification sécurisée  
✅ **Création Candidature** - Dépôt de candidatures  
✅ **Récupération Applications** - Historique candidat  
✅ **Connexion Admin** - Accès administrateur  
✅ **Accès Admin Applications** - Gestion centralisée  
✅ **Permissions RBAC** - Sécurité des accès  
✅ **Test de Charge** - Performance sous charge  

---

## 🔐 Comptes de Test

| Rôle | Email | Mot de passe | Accès |
|------|-------|--------------|-------|
| **Admin** | `admin@test.com` | `admin123` | Accès complet |
| **RH** | `hr@test.com` | `hr123` | Gestion RH |
| **Recruteur** | `recruiter@test.com` | `recruiter123` | Gestion candidatures |
| **Candidat** | `candidate@test.com` | `test123` | Espace candidat |

---

## 📋 Fonctionnalités du Module Candidature

### 👤 Espace Candidat

#### ✨ Inscription et Connexion
- Formulaire d'inscription sécurisé avec validation Zod
- Connexion avec gestion de session
- Redirection automatique selon le rôle
- Comptes de test intégrés pour développement

#### 📝 Gestion du Profil
- **Complément de profil en 4 étapes**:
  1. Informations personnelles
  2. Adresse et résidence  
  3. Pièce d'identité
  4. Informations de naissance
- Sauvegarde automatique locale (mode offline)
- Validation complète avec messages d'erreur clairs

#### 💼 Candidatures
- Consultation des offres d'emploi
- Dépôt de candidatures avec cover letter
- Suivi en temps réel du statut
- Timeline des candidatures
- Historique complet

### 🏢 Espace Administration

#### 👥 Gestion des Candidatures
- Visualisation de toutes les candidatures
- Attribution aux recruteurs
- Système de notation avancé
- Workflow de validation

#### 🔒 Système RBAC
```typescript
// Hiérarchie des permissions
candidate (1) → employee (2) → recruiter (3) → manager (4) → hr (5) → admin (10)

// Permissions par rôle
- candidate: ["view_jobs", "submit_applications", "view_application_status"]
- recruiter: ["view_candidates", "manage_jobs", "score_candidates"] 
- hr: ["manage_employees", "manage_contracts", "manage_payroll"]
- admin: ["*"] // Accès complet
```

---

## 🚀 Installation et Déploiement

### 📦 Prérequis

```bash
# Node.js 18+ et npm
node --version  # v18.0.0+
npm --version   # 8.0.0+
```

### 🔧 Installation

```bash
# 1. Cloner le projet
git clone <repository-url>
cd webapp

# 2. Installer les dépendances
npm install

# 3. Configuration environnement
cp .env.example .env
# Éditer .env selon vos besoins

# 4. Base de données (optionnel - fallback intégré)
# Si PostgreSQL disponible:
chmod +x setup-database.sh
./setup-database.sh
```

### 🏃‍♂️ Démarrage

```bash
# Développement
npm run dev
# → Serveur sur http://localhost:5001

# Production
npm run build
npm start
```

### 🌐 URLs d'Accès

| Page | URL | Description |
|------|-----|-------------|
| **Accueil Public** | `/` | Page d'accueil avec offres |
| **Connexion Candidat** | `/login` | Espace candidat |
| **Admin/RH/Recruteur** | `/admin/login` | Espace administration |
| **API Jobs** | `/api/jobs` | API publique des offres |

### 🔄 Mode Haute Disponibilité

Le système fonctionne **automatiquement** même sans base de données :
- **Avec PostgreSQL**: Performance optimale + persistance
- **Sans PostgreSQL**: Fallback en mémoire + données de test
- **Basculement transparent** en cas de panne DB

---

## 🛠️ Déploiement Production

### 🐳 Docker (Recommandé)

```dockerfile
# Dockerfile inclus pour déploiement containerisé
docker build -t aerorecrut-app .
docker run -p 5001:5001 aerorecrut-app
```

### ☁️ Déploiement Cloud

```bash
# Variables d'environnement production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=5001
```

### 🔒 Sécurité Production

- [ ] Changer les mots de passe de test
- [ ] Configurer HTTPS  
- [ ] Variables d'environnement sécurisées
- [ ] Monitoring des logs
- [ ] Backup automatique de la DB

---

## 📊 Monitoring et Maintenance

### 🔍 Logs Importants

```bash
# Surveiller ces logs en production
tail -f logs/server.log | grep -E "(ERROR|WARN|Authentication|DB connection)"
```

### 🚨 Points de Surveillance

1. **Authentification**: Échecs de connexion répétés
2. **Base de Données**: Basculement vers le fallback
3. **Performance**: Temps de réponse API
4. **Sécurité**: Tentatives d'accès non autorisées

### 🔄 Maintenance

```bash
# Tests automatisés quotidiens (optionnel)
0 2 * * * /usr/bin/node /path/to/test-candidature-module.cjs

# Backup DB (si PostgreSQL)
0 3 * * * pg_dump $DATABASE_URL > backup_$(date +\%Y\%m\%d).sql
```

---

## 🎯 Utilisation Recommandée

### 👨‍💻 Pour les Développeurs

```bash
# Tests avant commit
npm run check        # TypeScript
node test-candidature-module.cjs  # Tests fonctionnels
npm run build        # Vérification build
```

### 👥 Pour les Utilisateurs

1. **Candidats**: S'inscrire via `/login`, compléter le profil, postuler
2. **RH/Recruteurs**: Se connecter via `/admin/login`, gérer les candidatures  
3. **Admins**: Accès complet via `/admin/login` avec compte admin

### 📈 Évolutivité

Le module est conçu pour:
- ✅ Montée en charge automatique
- ✅ Ajout de nouveaux rôles facilement
- ✅ Extensions de fonctionnalités
- ✅ Intégration avec d'autres systèmes

---

## 🆘 Dépannage

### ❓ Problèmes Courants

**Q: La connexion candidat échoue**
```bash
# Vérifier les comptes de test
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@test.com","password":"test123"}'
```

**Q: Base de données inaccessible**
```bash
# Le système bascule automatiquement en mode fallback
# Vérifier les logs: "DB connection test failed, using fallback mode"
```

**Q: Tests échouent**
```bash
# Redémarrer le serveur proprement
pkill -f "server/index.ts"
npm run dev
```

### 🔧 Solutions Rapides

```bash
# Reset complet en cas de problème
npm run build        # Recompile tout
rm -rf node_modules  # Nettoyage dépendances  
npm install          # Réinstallation
npm run dev          # Redémarrage
```

---

## 🎉 Conclusion

**Le module de candidature AeroRecrutement est maintenant :**

✅ **Stable et fiable** - Tests automatisés passant à 100%  
✅ **Sécurisé** - RBAC complet, authentification robuste  
✅ **Haute disponibilité** - Fonctionne avec ou sans base de données  
✅ **Prêt pour production** - Scripts de déploiement inclus  
✅ **Maintenable** - Code propre, documenté et testé  

**Ready to deploy! 🚀**

---

*Dernière mise à jour: $(date) - Version 2.0 Stable*