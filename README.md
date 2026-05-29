# Elite Gym App

Application de demonstration React + Vite pour une salle de gym.

## Lancer la demo

1. Ouvrez un terminal dans ce dossier :
   `c:\Users\ACER\Downloads\gym-app`
2. Installez les dependances si ce n'est pas deja fait :
   `npm install`
3. Lancez la demo :
   `npm run dev`
4. Ouvrez le lien client affiche dans le terminal, souvent :
   `http://127.0.0.1:5173`

Sur Windows, si `npm run dev` est bloque par PowerShell, utilisez :
`npm.cmd run dev`

## Codes de demonstration

- Espace membre : `ELITE2024`
- Espace admin : `ADMIN2024`

## Liens separes

- Lien client a mettre dans le QR code :
  `http://127.0.0.1:5173`
- Lien admin prive, a ne pas mettre dans le QR code client :
  `http://127.0.0.1:5173/#/admin`

Le client ne voit pas le bouton admin sur sa page. Pour ouvrir l'admin, il faut connaitre le lien admin et le code admin.

## Base client locale

Chaque client est garde dans une petite base locale du navigateur apres son inscription ou son identification visiteur.

Le client peut revenir plus tard avec :

- son code client, par exemple `MBR...` ou `VIS...`
- son email
- son telephone

Depuis la page client, cliquez sur `Retrouver mon dossier`, entrez une de ces informations, puis ouvrez l'espace client retrouve.

Important : cette base est locale au navigateur. Pour une vraie application utilisee par plusieurs telephones ou ordinateurs, il faudra ensuite ajouter une vraie base de donnees en ligne.

## Paiement Wave

Apres une reservation, le client voit un bouton `Payer avec Wave`.

Dans cette demo, le bouton ouvre un lien Wave configure dans `src/App.tsx` avec la constante `WAVE_PAYMENT_LINK`.

Pour utiliser un vrai compte marchand, remplacez :

`https://pay.wave.com/m/elite-gym-demo`

par votre vrai lien marchand Wave Business ou par un lien genere par l'API Wave Checkout.

Quand le client clique sur le bouton, la transaction passe en `Paiement Wave lance`. L'admin peut ensuite verifier le paiement dans Wave et marquer la transaction comme `Paye`.

## Ce que l'admin peut faire

- Voir les inscrits et visiteurs identifies
- Voir toutes les seances programmees
- Voir les transactions
- Marquer une transaction comme payee, en attente ou annulee
- Annuler une seance programmee
- Faire le point d'une journee precise sans melanger les seances et l'argent des autres jours
- Recevoir une notification dans l'espace admin quand une nouvelle seance est programmee

Les donnees sont stockees dans le navigateur avec `localStorage`. C'est parfait pour une demo locale, mais pas encore pour une vraie application en production.

## Tester les notifications admin

1. Ouvrez le lien admin dans un onglet :
   `http://127.0.0.1:5173/#/admin`
2. Connectez-vous avec `ADMIN2024`
3. Ouvrez le lien client dans un autre onglet :
   `http://127.0.0.1:5173`
4. Programmez une seance cote client.
5. Retournez sur l'onglet admin : une notification apparaitra en haut du tableau de bord.

## Commandes utiles

- `npm.cmd run dev` : lance le serveur de developpement
- `npm.cmd run build` : verifie et compile l'application
- `npm.cmd run preview` : previsualise la version compilee

## Passer en vraie application vendable

Cette version est une demo locale. Pour vendre l'application a une vraie salle de sport, il faut la connecter a une base de donnees en ligne, securiser l'espace admin et brancher un vrai paiement Wave.

Les fichiers ajoutes pour preparer cette evolution :

- `.env.example` : modele des variables de configuration.
- `docs/PLAN_VERSION_VENDABLE.md` : plan simple pour passer de la demo a la version pro.
- `docs/supabase-schema.sql` : schema de base de donnees conseille pour Supabase.
- `docs/CHECKLIST_LANCEMENT.md` : liste de verification avant de vendre.

Ordre conseille :

1. Creer un projet Supabase.
2. Executer `docs/supabase-schema.sql` dans Supabase.
3. Copier `.env.example` vers `.env`.
4. Ajouter les vraies valeurs Supabase dans `.env`.
5. Remplacer progressivement `localStorage` par Supabase.
6. Ajouter la vraie connexion admin.
7. Connecter le vrai paiement Wave.
8. Deployer l'application en ligne.
