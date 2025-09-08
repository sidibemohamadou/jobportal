# 🧪 Script de Test Complet - AeroRecrutement

## 📋 Plan de Test Général

### 🎯 Objectifs
- Vérifier tous les formulaires et boutons
- Tester la navigation entre pages
- Valider les dashboards et graphiques
- Contrôler l'authentification et les rôles
- Vérifier les APIs et la base de données

---

## 🔗 Tests de Navigation et URLs

### 1. Routes Publiques (Non connecté)
| URL | Page Attendue | Statut | Notes |
|-----|---------------|--------|-------|
| `/` | Landing (page d'accueil) | ⏳ | Doit afficher les offres d'emploi |
| `/login` | CandidateLogin | ⏳ | Formulaire de connexion candidat |
| `/admin/login` | AdminLogin | ⏳ | Formulaire de connexion admin |
| `/candidate-invitation/:token` | CandidateInvitationHandler | ⏳ | Gestion des invitations |

### 2. Routes Candidats (Connecté comme candidat)
| URL | Page Attendue | Statut | Notes |
|-----|---------------|--------|-------|
| `/` | CandidateDashboard | ⏳ | Tableau de bord candidat |
| `/profile` | Profile | ⏳ | Profil du candidat |
| `/applications` | Applications | ⏳ | Candidatures du candidat |
| `/jobs` | Landing | ⏳ | Liste des offres |
| `/candidate-onboarding` | CandidateOnboarding | ⏳ | Processus d'intégration |
| `/onboarding-feedback` | OnboardingFeedback | ⏳ | Feedback d'intégration |
| `/achievements` | AchievementsPage | ⏳ | Réalisations |
| `/onboarding-calendar` | OnboardingCalendar | ⏳ | Calendrier d'intégration |

### 3. Routes Admin/RH (Connecté comme admin/RH)
| URL | Page Attendue | Statut | Notes |
|-----|---------------|--------|-------|
| `/` ou `/admin` | AdminDashboard | ⏳ | Tableau de bord admin |
| `/admin/jobs` | JobManagement | ⏳ | Gestion des offres |
| `/admin/applications` | ApplicationManagement | ⏳ | Gestion des candidatures |
| `/admin/assignment` | CandidateAssignment | ⏳ | Attribution des candidats |
| `/admin/scoring` | CandidateScoring | ⏳ | Notation des candidats |
| `/admin/final-results` | FinalResults | ⏳ | Résultats finaux |
| `/contracts` | ContractManagement | ⏳ | Gestion des contrats |
| `/hr` | HRManagement | ⏳ | Gestion RH |
| `/admin/payroll` | PayrollManagement | ⏳ | Gestion de la paie |
| `/admin/onboarding` | OnboardingManagement | ⏳ | Gestion de l'intégration |
| `/admin/interviews` | InterviewManagement | ⏳ | Gestion des entretiens |
| `/admin/employees` | EmployeeManagement | ⏳ | Gestion des employés |
| `/admin/invitations` | CandidateInvitations | ⏳ | Invitations candidats |
| `/admin/users` | UserManagement | ⏳ | Gestion des utilisateurs (admin uniquement) |

---

## 🖱️ Tests des Formulaires et Boutons

### 1. Formulaires de Connexion
- [ ] **CandidateLogin** : Champs email/mot de passe, bouton de connexion
- [ ] **AdminLogin** : Champs email/mot de passe, bouton de connexion admin
- [ ] Validation des champs obligatoires
- [ ] Messages d'erreur pour identifiants incorrects
- [ ] Redirection après connexion réussie

### 2. Formulaires de Candidature
- [ ] **ApplicationModal** : Formulaire de candidature avec upload CV
- [ ] Champs : nom, prénom, email, téléphone, lettre de motivation
- [ ] Upload de fichiers (CV, lettre de motivation)
- [ ] Validation des données avant envoi
- [ ] Consentement RGPD obligatoire

### 3. Formulaires de Profil
- [ ] **Profile** : Modification des informations personnelles
- [ ] **ProfileCompletion** : Complétion du profil candidat
- [ ] Sauvegarde des modifications
- [ ] Validation des champs

### 4. Formulaires de Gestion (Admin)
- [ ] **JobManagement** : Création/modification d'offres d'emploi
- [ ] **UserManagement** : Gestion des utilisateurs
- [ ] **PayrollManagement** : Gestion de la paie avec fiches de paie
- [ ] Boutons d'action (Créer, Modifier, Supprimer)
- [ ] Modales de confirmation

---

## 📊 Tests des Dashboards et Graphiques

### 1. CandidateDashboard
- [ ] Statistiques personnelles (candidatures envoyées, en attente, etc.)
- [ ] Graphiques de progression
- [ ] Candidatures récentes
- [ ] Statut du profil

### 2. AdminDashboard
- [ ] KPIs généraux (nombre de candidats, offres, etc.)
- [ ] Graphiques de performance
- [ ] Statistiques des candidatures
- [ ] Analytiques des emplois
- [ ] Widgets de résumé

### 3. PayrollManagement
- [ ] Gestion complète des fiches de paie
- [ ] Génération PDF des bulletins
- [ ] Calculs automatiques (salaire brut, net, cotisations)
- [ ] Envoi par email des fiches de paie
- [ ] Historique des paiements

---

## 🔐 Tests d'Authentification et Rôles

### 1. Système d'Authentification
- [ ] Connexion avec Replit Auth
- [ ] Sessions persistantes
- [ ] Déconnexion propre
- [ ] Redirection automatique si non connecté

### 2. Gestion des Rôles
- [ ] **Candidat** : Accès limité aux pages candidat
- [ ] **Recruteur** : Accès aux outils de recrutement
- [ ] **RH** : Accès aux fonctions RH et paie
- [ ] **Admin** : Accès complet à toutes les fonctions
- [ ] Restriction d'accès selon le rôle
- [ ] Page d'erreur pour accès non autorisé

---

## 🔌 Tests des APIs et Base de Données

### 1. APIs d'Authentification
- [ ] `GET /api/auth/user` : Récupération de l'utilisateur connecté
- [ ] Gestion des sessions PostgreSQL
- [ ] Vérification des permissions par rôle

### 2. APIs de Gestion des Emplois
- [ ] `GET /api/jobs` : Liste des offres d'emploi
- [ ] `POST /api/admin/jobs` : Création d'offre (admin)
- [ ] `PUT /api/admin/jobs/:id` : Modification d'offre (admin)
- [ ] `DELETE /api/admin/jobs/:id` : Suppression d'offre (admin)

### 3. APIs de Candidatures
- [ ] `GET /api/applications` : Candidatures du candidat
- [ ] `POST /api/applications` : Nouvelle candidature
- [ ] `GET /api/admin/applications` : Toutes les candidatures (admin)
- [ ] `PUT /api/admin/applications/:id` : Modification statut (admin)

### 4. APIs de Gestion des Fichiers
- [ ] Upload de documents (CV, lettres de motivation)
- [ ] Génération de fiches de paie PDF
- [ ] Stockage sécurisé avec ACL
- [ ] Accès contrôlé aux documents

### 5. APIs Analytics et KPIs
- [ ] `GET /api/admin/kpis` : Indicateurs de performance
- [ ] `GET /api/admin/analytics/jobs` : Analytiques des emplois
- [ ] `GET /api/admin/analytics/applications` : Analytiques des candidatures

---

## 🎨 Tests de l'Interface Utilisateur

### 1. Composants UI
- [ ] **Boutons** : Tous les boutons sont cliquables et réactifs
- [ ] **Formulaires** : Validation en temps réel
- [ ] **Modales** : Ouverture/fermeture correcte
- [ ] **Navigation** : Liens fonctionnels
- [ ] **Loading states** : Indicateurs de chargement

### 2. Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Tablette (768x1024)
- [ ] Mobile (375x667)
- [ ] Adaptation des dashboards

### 3. Accessibilité
- [ ] Attributs `data-testid` sur tous les éléments interactifs
- [ ] Navigation au clavier
- [ ] Contrastes de couleurs
- [ ] Textes alternatifs

---

## 🔄 Tests d'Intégration

### 1. Workflow Complet de Candidature
1. [ ] Candidat visite la page d'accueil
2. [ ] Candidat consulte les offres d'emploi
3. [ ] Candidat se connecte ou s'inscrit
4. [ ] Candidat complète son profil
5. [ ] Candidat postule à une offre
6. [ ] Upload de documents réussi
7. [ ] Candidature visible dans l'interface candidat
8. [ ] Candidature visible dans l'interface admin

### 2. Workflow de Gestion Admin
1. [ ] Admin se connecte
2. [ ] Admin accède au dashboard
3. [ ] Admin crée une nouvelle offre d'emploi
4. [ ] Admin consulte les candidatures
5. [ ] Admin modifie le statut d'une candidature
6. [ ] Admin accède aux analytics

### 3. Workflow RH Complet
1. [ ] RH accède à la gestion des employés
2. [ ] RH crée une fiche de paie
3. [ ] RH génère le PDF de la fiche de paie
4. [ ] RH envoie la fiche par email
5. [ ] RH consulte l'historique des paies

---

## 🚨 Tests d'Erreurs

### 1. Gestion des Erreurs
- [ ] Erreurs de réseau (API indisponible)
- [ ] Erreurs de validation (données invalides)
- [ ] Erreurs d'authentification (session expirée)
- [ ] Erreurs de permissions (accès interdit)
- [ ] Pages non trouvées (404)

### 2. États d'Exception
- [ ] Données vides (pas de candidatures, pas d'offres)
- [ ] Chargement en cours
- [ ] Erreurs de connexion base de données
- [ ] Fichiers corrompus lors de l'upload

---

## ✅ Checklist de Validation Finale

- [ ] Toutes les routes fonctionnent
- [ ] Tous les formulaires soumettent correctement
- [ ] Tous les boutons sont fonctionnels
- [ ] Les dashboards affichent les bonnes données
- [ ] Les graphiques se chargent
- [ ] L'authentification fonctionne
- [ ] Les rôles sont respectés
- [ ] Les APIs répondent correctement
- [ ] La base de données est accessible
- [ ] Les fichiers s'uploadent
- [ ] Les PDFs se génèrent
- [ ] L'interface est responsive
- [ ] Aucune erreur JavaScript dans la console
- [ ] Performance acceptable (< 3s pour le chargement)

---

## 📝 Rapport d'État

**Date du test** : [À compléter]
**Version testée** : [À compléter]
**Testeur** : [À compléter]

**Résumé** :
- ✅ Tests réussis : X/Y
- ❌ Tests échoués : X/Y
- ⚠️ Points d'attention : [À noter]

**Problèmes identifiés** :
[À compléter lors des tests]

**Actions recommandées** :
[À compléter selon les résultats]