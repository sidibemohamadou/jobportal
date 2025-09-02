# Guide de Navigation - AeroRecrutement

## 🔗 Liens d'Accès Principal

### Connexion
- **Connexion Admin/HR/Recruteur**: [/api/login](/api/login)
- **Page d'accueil publique**: [/](/)

---

## 👥 Comptes de Test Disponibles

### 🔐 Admin/Super Admin - Mohamed
- **Email**: mohamed.admin@aerorecrut.com
- **Nom**: Mohamed Administrateur
- **Rôle**: Super Administrateur
- **Accès**: Toutes les fonctionnalités

### 👤 Candidat de Test
- **Email**: candidat.test@example.com
- **Nom**: Jean Dupont
- **Rôle**: Candidat
- **Accès**: Dashboard candidat, candidatures, profil

### 🏢 RH de Test
- **Email**: rh.test@aerorecrut.com
- **Nom**: Marie Martin
- **Rôle**: Ressources Humaines
- **Accès**: Gestion RH, contrats, paie

### 🎯 Recruteur de Test
- **Email**: recruteur.test@aerorecrut.com
- **Nom**: Pierre Durand
- **Rôle**: Recruteur
- **Accès**: Gestion candidatures, entretiens

### 👔 Employé de Test
- **Email**: employe.test@aerorecrut.com
- **Nom**: Sophie Bernard
- **Rôle**: Employé
- **Accès**: Profil employé, congés

---

## 🗺️ Toutes les Vues Disponibles

### 📱 Pages Publiques (Non connecté)
| Route | Description |
|-------|-------------|
| `/` | Page d'accueil avec offres d'emploi |
| `/candidate-login` | Connexion candidat |
| `/candidate-invitation/:token` | Invitation candidat personnalisée |

### 👤 Espace Candidat
| Route | Description |
|-------|-------------|
| `/` | Dashboard candidat |
| `/profile` | Gestion du profil |
| `/applications` | Mes candidatures avec timeline |
| `/jobs` | Voir toutes les offres |
| `/candidate-onboarding` | Processus d'intégration |
| `/onboarding-feedback` | Feedback d'intégration |
| `/achievements` | Mes réalisations |
| `/onboarding-calendar` | Calendrier d'intégration |

### 🏢 Espace Administration (Admin/HR/Recruteur)
| Route | Description |
|-------|-------------|
| `/` | Dashboard administrateur |
| `/admin` | Tableau de bord admin |
| `/admin/jobs` | Gestion des offres d'emploi |
| `/admin/applications` | Gestion des candidatures |
| `/admin/assignment` | Attribution des candidats |
| `/admin/scoring` | Notation des candidats |
| `/admin/final-results` | Résultats finaux |
| `/contracts` | Gestion des contrats |
| `/hr` | Gestion RH |
| `/admin/payroll` | Gestion de la paie |
| `/admin/onboarding` | Gestion de l'intégration |
| `/admin/interviews` | Gestion des entretiens |
| `/admin/employees` | Gestion des employés |
| `/admin/invitations` | Invitations candidats |

### 🔐 Espace Super Admin (Admin uniquement)
| Route | Description |
|-------|-------------|
| `/admin/users` | Gestion des utilisateurs |

---

## 🚀 Comment Tester

### 1. Connexion en tant qu'Admin (Mohamed)
1. Aller sur [/api/login](/api/login)
2. Se connecter avec le compte Replit
3. Accès complet à toutes les fonctionnalités

### 2. Test du Candidat
1. Utiliser le compte candidat de test
2. Naviguer dans l'espace candidat
3. Tester le complément de profil

### 3. Test des Autres Rôles
1. Se connecter avec les comptes RH/Recruteur/Employé
2. Explorer les fonctionnalités spécifiques à chaque rôle

---

## 🎯 Fonctionnalités Principales à Tester

### ✅ Candidat
- [ ] Complément de profil (4 étapes)
- [ ] Candidature aux offres
- [ ] Suivi des candidatures avec timeline
- [ ] Dashboard personnel
- [ ] Processus d'intégration

### ✅ Admin/HR/Recruteur
- [ ] Gestion des offres d'emploi
- [ ] Gestion des candidatures
- [ ] Système de notation
- [ ] Gestion des contrats
- [ ] Système de paie
- [ ] Gestion des entretiens
- [ ] Invitations personnalisées

### ✅ Intégrations Avancées
- [ ] Timeline de candidature
- [ ] Système d'achievements
- [ ] Calendrier d'intégration
- [ ] Feedback système
- [ ] Analytics et rapports

---

## 📞 Support

Pour toute question ou problème, contacter l'équipe de développement.

*Dernière mise à jour: $(date)*