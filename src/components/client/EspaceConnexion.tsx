import { useState } from "react";
import { Users } from "lucide-react";
import type { Profil } from "../../types";
import { BoutonRetour } from "../ui";

export function EspaceConnexionClient({
  profils,
  sauverProfil,
  ouvrirDossier,
  retour,
}: {
  profils: Profil[];
  sauverProfil: (profil: Profil) => void;
  ouvrirDossier: (type: "membre" | "visiteur") => void;
  retour: () => void;
}) {
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState("");
  const [clientTrouve, setClientTrouve] = useState<Profil | null>(null);

  const normaliser = (valeur?: string) => (valeur || "").trim().toLowerCase();

  const chercherClient = () => {
    const saisie = normaliser(recherche);

    if (!saisie) {
      setErreur("Entrez votre code, email ou t\u00e9l\u00e9phone.");
      setClientTrouve(null);
      return;
    }

    const trouve = profils.find((p) => {
      const code = normaliser(p.code);
      const email = normaliser(p.email);
      const tel = normaliser(p.tel).replace(/\s+/g, "");
      const saisieTel = saisie.replace(/\s+/g, "");
      return code === saisie || email === saisie || (tel && tel === saisieTel);
    });

    if (!trouve || !trouve.type) {
      setErreur("Aucun dossier trouv\u00e9 avec cette information.");
      setClientTrouve(null);
      return;
    }

    setErreur("");
    setClientTrouve(trouve);
  };

  const ouvrir = () => {
    if (!clientTrouve?.type) return;
    sauverProfil(clientTrouve);
    ouvrirDossier(clientTrouve.type);
  };

  return (
    <div className="max-w-md mx-auto">
      <BoutonRetour onClick={retour} />
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mt-4">
        <div className="text-center mb-6">
          <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
            <Users size={28} />
          </div>
          <h2 className="text-2xl font-bold">Retrouver mon dossier</h2>
          <p className="text-zinc-400 text-sm mt-1">Utilisez votre code client, email ou t\u00e9l\u00e9phone.</p>
        </div>

        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Code, email ou t\u00e9l\u00e9phone</label>
        <input
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value);
            setErreur("");
            setClientTrouve(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") chercherClient();
          }}
          placeholder="Ex : MBR..., VIS..., email ou t\u00e9l\u00e9phone"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
        />

        {erreur && <p className="text-red-400 text-sm mt-2">{erreur}</p>}

        <button onClick={chercherClient} className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-4">
          Rechercher mon dossier
        </button>

        {clientTrouve && (
          <div className="bg-zinc-950 border border-amber-400/30 rounded-xl p-4 mt-5">
            <div className="text-sm text-zinc-400">Dossier trouv\u00e9</div>
            <div className="font-bold text-lg mt-1">{clientTrouve.prenom || "Client"} {clientTrouve.nom}</div>
            <div className="text-sm text-zinc-400">{clientTrouve.type === "membre" ? "Membre" : "Visiteur"} \u00b7 {clientTrouve.code}</div>
            <button onClick={ouvrir} className="w-full bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 font-bold py-2.5 rounded-lg transition mt-4">
              Ouvrir mon espace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
