import { useState } from "react";
import { User } from "lucide-react";
import type { Paiement, Profil, Reservation } from "../../types";
import { CODE_DEMO, TARIFS } from "../../utils/constants";
import { BoutonRetour } from "../ui";
import { TableauDeBord } from "./TableauDeBord";

export function EspaceMembre({
  profil,
  profils,
  sauverProfil,
  reservations,
  sauverReservations,
  paiements,
  sauverPaiements,
  retour,
}: {
  profil: Profil;
  profils: Profil[];
  sauverProfil: (profil: Profil) => void;
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  retour: () => void;
}) {
  const estMembreConnecte = profil.type === "membre";
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");

  if (!estMembreConnecte) {
    return (
      <div className="max-w-md mx-auto">
        <BoutonRetour onClick={retour} />
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mt-4">
          <div className="text-center mb-6">
            <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
              <User size={28} />
            </div>
            <h2 className="text-2xl font-bold">Espace Membre</h2>
            <p className="text-zinc-400 text-sm mt-1">Entrez votre code d'acc\u00e8s pour continuer</p>
          </div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Code d'acc\u00e8s</label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setErreur("");
            }}
            placeholder="Votre code membre (MBR...)"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-1 tracking-widest font-mono"
          />
          {erreur && <p className="text-red-400 text-sm mb-2">{erreur}</p>}
          <button
            onClick={() => {
              const codeSaisi = code.trim().toUpperCase();
              const profilExistant = profils.find(
                (p) => p.type === "membre" && p.code?.trim().toUpperCase() === codeSaisi
              );

              if (profilExistant) {
                sauverProfil(profilExistant);
              } else if (codeSaisi === CODE_DEMO) {
                sauverProfil({
                  type: "membre",
                  code: codeSaisi,
                  nom: profil.nom || "",
                  prenom: profil.prenom || "",
                  email: profil.email || "",
                  tel: profil.tel || "",
                  abonnement: profil.abonnement,
                  abonnementInscription: profil.abonnementInscription,
                });
              } else {
                setErreur("Code invalide. V\u00e9rifiez votre code membre.");
              }
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-3">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <TableauDeBord
      type="membre"
      profil={profil}
      sauverProfil={sauverProfil}
      reservations={reservations}
      sauverReservations={sauverReservations}
      paiements={paiements}
      sauverPaiements={sauverPaiements}
      tarifs={TARIFS.membre}
      retour={retour}
      deconnexion={() => sauverProfil({ type: null })}
    />
  );
}
