import { useEffect, useState } from "react";
import type { Paiement, Profil, Reservation } from "../types";
import { fusionnerProfil, lireEspace } from "../utils/helpers";
import { store } from "../utils/store";

export function useAppData() {
  const [vue, setVue] = useState("accueil");
  const [espace, setEspace] = useState(lireEspace);
  const [chargement, setChargement] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profil, setProfil] = useState<Profil>({ type: null });
  const [profils, setProfils] = useState<Profil[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  useEffect(() => {
    const reservationsStockees = store.get<Reservation[]>("reservations", []);
    const profilStocke = store.get<Profil>("profil", { type: null });
    let profilsStockes = store.get<Profil[]>("profils", []);
    const paiementsStockes = store.get<Paiement[]>("paiements", []);

    if (profilStocke.type) {
      profilsStockes = fusionnerProfil(profilsStockes, profilStocke);
      store.set("profils", profilsStockes);
    }

    setReservations(reservationsStockees);
    setProfil(profilStocke);
    setProfils(profilsStockes);
    setPaiements(paiementsStockes);
    setChargement(false);
  }, []);

  const sauverReservations = (r: Reservation[]) => {
    setReservations(r);
    store.set("reservations", r);
  };

  const sauverProfil = (p: Profil) => {
    setProfil(p);
    store.set("profil", p);
    if (p.type) {
      setProfils((actuels) => {
        const prochains = fusionnerProfil(actuels, p);
        store.set("profils", prochains);
        return prochains;
      });
    }
  };

  const sauverProfils = (p: Profil[]) => {
    setProfils(p);
    store.set("profils", p);
  };

  const sauverPaiements = (p: Paiement[]) => {
    setPaiements(p);
    store.set("paiements", p);
  };

  useEffect(() => {
    const synchroniserEspace = () => setEspace(lireEspace());
    const synchroniserDonnees = (event: StorageEvent) => {
      if (event.key === "reservations") {
        setReservations(event.newValue ? (JSON.parse(event.newValue) as Reservation[]) : []);
      }
      if (event.key === "paiements") {
        setPaiements(event.newValue ? (JSON.parse(event.newValue) as Paiement[]) : []);
      }
      if (event.key === "profils") {
        setProfils(event.newValue ? (JSON.parse(event.newValue) as Profil[]) : []);
      }
      if (event.key === "profil") {
        setProfil(event.newValue ? (JSON.parse(event.newValue) as Profil) : { type: null });
      }
    };

    window.addEventListener("hashchange", synchroniserEspace);
    window.addEventListener("popstate", synchroniserEspace);
    window.addEventListener("storage", synchroniserDonnees);

    return () => {
      window.removeEventListener("hashchange", synchroniserEspace);
      window.removeEventListener("popstate", synchroniserEspace);
      window.removeEventListener("storage", synchroniserDonnees);
    };
  }, []);

  return {
    vue, setVue,
    espace, setEspace,
    chargement,
    reservations, sauverReservations,
    profil, sauverProfil,
    profils, sauverProfils,
    paiements, sauverPaiements,
  };
}
