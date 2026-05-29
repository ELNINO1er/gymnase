# Elite Gym — Application de gestion de salle de sport

Application full-stack pour la gestion complete d'une salle de sport : membres, abonnements, reservations, paiements et administration.

## Architecture

```
gym-app/
├── src/                 ← Frontend React + Vite + TypeScript + Tailwind
├── backend/             ← API Node.js + Express + TypeScript
├── database/            ← Migrations SQL (MySQL)
└── docs/                ← Documentation technique
```

## Tech Stack

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, TypeScript, JWT, bcrypt, Zod |
| Base de donnees | MySQL 8 |
| Securite | Helmet, CORS, Rate Limiting, Input Sanitization |

## Prerequis

- Node.js v18+
- MySQL (WAMP, MAMP, ou serveur distant)

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd gym-app
```

### 2. Installer les dependances

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 3. Configurer la base de donnees

Creer la base MySQL :

```sql
CREATE DATABASE IF NOT EXISTS gym_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configurer l'environnement

```bash
# Backend
cp backend/.env.example backend/.env
# Modifier les valeurs si necessaire (DB_USER, DB_PASSWORD, JWT_SECRET)

# Frontend (optionnel)
cp .env.example .env
```

### 5. Executer les migrations et le seed

```bash
cd backend
npm run migrate   # Cree les tables
npm run seed      # Insere les donnees de demo
```

### 6. Demarrer l'application

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
npm run dev
```

### 7. Ouvrir dans le navigateur

- Frontend : http://localhost:5173
- API Health : http://localhost:3001/api/health

## Comptes de demonstration

| Role | Identifiant | Mot de passe |
|------|-------------|--------------|
| Admin | admin@elitegym.com | admin123 |
| Membre | moussa@test.com | test123 |

## Fonctionnalites

### Visiteur (public)
- Consulter les tarifs et types de seances
- S'inscrire (inscription en attente de validation)
- Se connecter

### Membre
- Voir son abonnement (plan, expiration, jours restants)
- Reserver des seances (verification places disponibles)
- Consulter l'historique des reservations et paiements
- Modifier son profil et mot de passe

### Administrateur
- Dashboard avec stats en temps reel (revenus, membres, reservations)
- Valider/suspendre/reactiver des membres
- Gerer les reservations (confirmer, marquer absent, annuler)
- Gerer les paiements (valider, annuler, rembourser)
- Creer/modifier les plans d'abonnement
- Envoyer des notifications (ciblees ou broadcast)

## API Reference

### Authentification
```
POST   /api/auth/register        Inscription
POST   /api/auth/login           Connexion (retourne JWT)
GET    /api/auth/me              Profil connecte
PUT    /api/auth/password        Changer mot de passe
PUT    /api/auth/profile         Modifier profil
POST   /api/auth/refresh         Renouveler token
```

### Utilisateurs (Admin)
```
GET    /api/users                Liste paginee + filtres
GET    /api/users/:id            Detail complet
POST   /api/users                Creer un utilisateur
PUT    /api/users/:id            Modifier
DELETE /api/users/:id            Supprimer (soft)
PUT    /api/users/:id/validate   Valider inscription
PUT    /api/users/:id/suspend    Suspendre
PUT    /api/users/:id/reactivate Reactiver
GET    /api/users/search         Recherche rapide
GET    /api/users/stats          Statistiques
```

### Plans
```
GET    /api/plans                Liste (public)
POST   /api/plans                Creer (admin)
PUT    /api/plans/:id            Modifier (admin)
DELETE /api/plans/:id            Desactiver (admin)
```

### Abonnements
```
GET    /api/subscriptions              Liste (admin)
GET    /api/subscriptions/user/:id     Abonnements d'un membre
POST   /api/subscriptions              Creer
PUT    /api/subscriptions/:id/activate Activer
PUT    /api/subscriptions/:id/cancel   Annuler
PUT    /api/subscriptions/:id/renew    Renouveler
GET    /api/subscriptions/expired      Detecter expires
```

### Reservations
```
GET    /api/reservations/sessions       Types de seances (public)
GET    /api/reservations/available-slots Creneaux disponibles
POST   /api/reservations                Reserver
GET    /api/reservations/user/:id       Mes reservations
PUT    /api/reservations/:id/cancel     Annuler
PUT    /api/reservations/:id/complete   Terminer (admin)
PUT    /api/reservations/:id/no-show    Absent (admin)
GET    /api/reservations                Liste (admin)
GET    /api/reservations/today          Aujourd'hui (admin)
```

### Paiements
```
GET    /api/payments              Liste (admin)
GET    /api/payments/user/:id     Paiements d'un membre
POST   /api/payments              Creer (admin)
PUT    /api/payments/:id/validate Valider
PUT    /api/payments/:id/cancel   Annuler
PUT    /api/payments/:id/refund   Rembourser
GET    /api/payments/stats/daily  Revenus du jour
GET    /api/payments/stats/monthly Revenus du mois
```

### Dashboard (Admin)
```
GET    /api/dashboard/summary            Vue globale
GET    /api/dashboard/revenue/daily      Revenus journaliers
GET    /api/dashboard/revenue/monthly    Revenus mensuels
GET    /api/dashboard/reservations/today Reservations du jour
GET    /api/dashboard/members/stats      Stats membres
```

### Notifications
```
GET    /api/notifications          Mes notifications
PUT    /api/notifications/:id/read Marquer lue
PUT    /api/notifications/read-all Tout lire
POST   /api/notifications          Envoyer (admin)
DELETE /api/notifications/:id      Supprimer
```

## Deploiement

### Frontend
- Vercel : `npx vercel` depuis la racine
- Netlify : Build command `npm run build`, publish dir `dist`

### Backend
- Railway : connecter le repo, root directory `backend`
- Render : Node.js, build `npm install && npm run build`, start `npm start`

### Base de donnees
- PlanetScale (MySQL serverless)
- Railway MySQL
- DigitalOcean Managed Database

## Securite implementee

- Mots de passe hashes (bcrypt 12 rounds)
- Authentification JWT avec expiration
- Rate limiting (login: 20 req/15min, API: 200 req/min)
- Validation Zod sur tous les inputs
- Protection XSS (sanitization des inputs)
- Helmet (headers de securite)
- CORS configure par environnement
- Soft delete (pas de suppression physique)
- Verification d'abonnement avant reservation
- Verification de capacite avant reservation
