# Checklist avant de vendre Elite Gym

## Produit

- [ ] Le client peut reserver une seance depuis son telephone.
- [ ] L'admin voit la reservation depuis un autre appareil.
- [ ] Le client peut retrouver son dossier.
- [ ] L'admin peut voir tous les inscrits.
- [ ] L'admin peut voir les transactions.
- [ ] Le point de la journee ne melange pas les dates.
- [ ] Les textes sont propres sur mobile.
- [ ] Le QR code client ouvre seulement la partie client.
- [ ] Le lien admin reste separe.

## Donnees

- [ ] Les donnees sont dans une base en ligne.
- [ ] Les donnees ne disparaissent pas quand on change de navigateur.
- [ ] Les seances ne peuvent pas etre reservees deux fois au meme creneau.
- [ ] Les paiements restent lies aux bonnes seances.
- [ ] Les clients restent lies a la bonne salle.

## Securite

- [ ] Le code admin de demo est remplace par une vraie connexion.
- [ ] Un client ne peut pas ouvrir l'espace admin.
- [ ] Un client ne voit pas les infos d'un autre client.
- [ ] Les cles secretes de paiement ne sont pas dans le frontend.
- [ ] Les variables sensibles sont dans `.env`.

## Paiement

- [ ] Le compte Wave marchand est pret.
- [ ] Le lien Wave ou le checkout Wave utilise une vraie reference de paiement.
- [ ] L'admin peut verifier le paiement.
- [ ] Le statut `paye` n'est pas modifie sans controle.

## Mise en ligne

- [ ] L'app est deployee sur Vercel ou Netlify.
- [ ] Le nom de domaine est branche.
- [ ] Le QR code utilise l'URL publique.
- [ ] L'app est testee sur Android.
- [ ] L'app est testee sur iPhone.
- [ ] L'app est testee avec un compte admin et deux clients.

## Commercial

- [ ] Preparer une demo de 3 minutes.
- [ ] Preparer le prix mensuel.
- [ ] Preparer une offre installation + abonnement.
- [ ] Preparer une fiche simple avec les benefices pour la salle.
