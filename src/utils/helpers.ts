import type { Paiement, Profil } from "../types";
import { WAVE_PAYMENT_LINK } from "./constants";

export const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export const dateIsoAujourdhui = () => {
  const date = new Date();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
};

export const formatDateFr = (dateIso: string) =>
  new Date(`${dateIso}T00:00:00`).toLocaleDateString("fr-FR");

export const creerId = (prefixe: string) =>
  `${prefixe}${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const creerPaiement = (paiement: Omit<Paiement, "date" | "dateIso">): Paiement => {
  const dateIso = dateIsoAujourdhui();
  return { ...paiement, dateIso, date: formatDateFr(dateIso) };
};

export const creerLienPaiementWave = (montant: number, reference: string) => {
  const params = new URLSearchParams({
    amount: String(montant),
    currency: "XOF",
    reference,
  });
  return `${WAVE_PAYMENT_LINK}?${params.toString()}`;
};

export const identifiantProfil = (profil: Profil) => {
  if (profil.code?.trim()) return profil.code.trim().toUpperCase();
  if (profil.email?.trim()) return `EMAIL:${profil.email.trim().toLowerCase()}`;
  return `${profil.type || "profil"}:${profil.prenom || ""}:${profil.nom || ""}`.toLowerCase();
};

export const fusionnerProfil = (profils: Profil[], profil: Profil) => {
  const id = identifiantProfil(profil);
  const dejaInscrit = profils.find((p) => identifiantProfil(p) === id);
  const profilAvecDate = {
    ...dejaInscrit,
    ...profil,
    inscritLe: dejaInscrit?.inscritLe || profil.inscritLe || new Date().toLocaleDateString("fr-FR"),
  };
  return [...profils.filter((p) => identifiantProfil(p) !== id), profilAvecDate];
};

export const lireEspace = () =>
  window.location.hash === "#/admin" || window.location.pathname === "/admin"
    ? "admin"
    : "client";
