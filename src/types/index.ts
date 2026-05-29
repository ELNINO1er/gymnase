export type Tarifs = {
  seance: number;
  inscription: number;
};

export type Profil = {
  type: "membre" | "visiteur" | null;
  code?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  tel?: string;
  abonnement?: { nom: string; prix?: number; debut?: string };
  abonnementInscription?: boolean;
  inscritLe?: string;
};

export type Reservation = {
  id: string;
  proprietaire: string;
  type: string;
  icone: string;
  date: string;
  creneau: string;
  prix: number;
  cree: number;
};

export type Paiement = {
  id: string;
  proprietaire: string;
  reservationId?: string;
  libelle: string;
  montant: number;
  date: string;
  dateIso?: string;
  statut: string;
};

export type TypeSeance = {
  id: string;
  nom: string;
  icone: string;
};
