# Transformer Elite Gym en vraie app vendable

Ce document sert de feuille de route simple. L'objectif est de passer de la demo actuelle a une application utilisable par une vraie salle de sport.

## Etat actuel

L'application actuelle est une bonne demo :

- interface client separee de l'admin ;
- reservation de seances ;
- paiement Wave simule par lien ;
- liste des clients ;
- transactions ;
- point de la journee ;
- notifications admin dans le navigateur.

Mais les donnees sont encore stockees dans le navigateur avec `localStorage`. Ce n'est pas suffisant pour vendre l'app a une salle, car les donnees ne sont pas partagees entre plusieurs telephones ou ordinateurs.

## Version 1 vendable

Pour une premiere version vendable, il faut :

1. Remplacer `localStorage` par une vraie base de donnees en ligne.
2. Ajouter une connexion admin securisee.
3. Ajouter une connexion client simple avec telephone, email ou code.
4. Synchroniser les reservations et paiements entre client et admin.
5. Garder le point de la journee avec une date precise.
6. Integrer Wave proprement avec une verification du statut de paiement.
7. Deployer l'app en ligne avec un vrai nom de domaine.

## Choix technique conseille

Pour avancer vite sans construire un gros backend au debut :

- Frontend : React + Vite, comme maintenant.
- Base de donnees : Supabase.
- Authentification : Supabase Auth pour l'admin et les clients.
- Hebergement : Vercel ou Netlify.
- Paiement : Wave Business / Wave Checkout, avec verification serveur avant de marquer un paiement comme paye.

Supabase est un bon choix pour cette app parce qu'il donne une base PostgreSQL, une authentification, une API et une console admin sans devoir tout programmer a la main.

## Etapes de travail

### Phase 1 - Preparation

- Ajouter `.env.example`.
- Ajouter un schema SQL pour la base.
- Documenter les tables importantes.
- Garder la demo actuelle fonctionnelle pendant la migration.

### Phase 2 - Base de donnees

- Creer un projet Supabase.
- Creer les tables `gyms`, `profiles`, `sessions`, `payments`, `daily_reports`.
- Brancher l'app React a Supabase.
- Lire et ecrire les reservations dans la base au lieu du navigateur.

### Phase 3 - Connexion

- Creer un vrai compte admin.
- Creer une connexion client simple.
- Proteger l'espace admin.
- Empecher un client de voir les donnees d'un autre client.

### Phase 4 - Paiements

- Garder le bouton Wave cote client.
- Creer une transaction avant l'ouverture de Wave.
- Verifier le paiement avec un retour serveur ou une validation admin.
- Marquer automatiquement ou manuellement le paiement comme paye.

### Phase 5 - Mise en ligne

- Deployer l'app.
- Ajouter le nom de domaine.
- Generer le QR code client avec l'URL publique.
- Garder le lien admin prive.
- Tester depuis deux telephones differents.

## Regle importante

On ne doit pas tout casser d'un coup. La bonne methode est de remplacer une partie a la fois :

1. Les clients.
2. Les seances.
3. Les paiements.
4. L'admin.
5. Les notifications.

Comme ca, la demo reste utilisable a chaque etape.
