import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { Paiement, Profil, Reservation } from "../../types";
import { TARIFS } from "../../utils/constants";
import { creerId } from "../../utils/helpers";
import { BoutonRetour, Champ } from "../ui";
import { TableauDeBord } from "./TableauDeBord";

export function EspaceVisiteur({
  profil,
  sauverProfil,
  reservations,
  sauverReservations,
  paiements,
  sauverPaiements,
  retour,
}: {
  profil: Profil;
  sauverProfil: (profil: Profil) => void;
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  retour: () => void;
}) {
  const estIdentifie = profil.type === "visiteur";
  const [form, setForm] = useState({ nom: profil.nom || "", prenom: profil.prenom || "", tel: profil.tel || "" });
  const [erreur, setErreur] = useState("");

  if (!estIdentifie) {
    return (
      <div className="max-w-md mx-auto">
        <BoutonRetour onClick={retour} />
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mt-4">
          <div className="text-center mb-6">
            <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
              <UserPlus size={28} />
            </div>
            <h2 className="text-2xl font-bold">Identification</h2>
            <p className="text-zinc-400 text-sm mt-1">Quelques informations pour r\u00e9server vos s\u00e9ances</p>
          </div>
          <div className="space-y-3">
            <Champ label="Pr\u00e9nom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
            <Champ label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
            <Champ label="T\u00e9l\u00e9phone" type="tel" value={form.tel} onChange={(v) => setForm({ ...form, tel: v })} />
          </div>
          {erreur && <p className="text-red-400 text-sm mt-2">{erreur}</p>}
          <button
            onClick={() => {
              if (!form.prenom.trim() || !form.nom.trim()) {
                setErreur("Le nom et le pr\u00e9nom sont obligatoires.");
                return;
              }
              sauverProfil({ type: "visiteur", code: profil.code || creerId("VIS"), ...form });
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-5">
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <TableauDeBord
      type="visiteur"
      profil={profil}
      sauverProfil={sauverProfil}
      reservations={reservations}
      sauverReservations={sauverReservations}
      paiements={paiements}
      sauverPaiements={sauverPaiements}
      tarifs={TARIFS.visiteur}
      retour={retour}
      deconnexion={() => sauverProfil({ type: null })}
    />
  );
}
