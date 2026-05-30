import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import type { Paiement, Profil } from "../../types";
import { TARIFS } from "../../utils/constants";
import { creerId, creerPaiement, fmt } from "../../utils/helpers";
import { BoutonRetour } from "../ui";

export function EspaceInscription({
  profil,
  sauverProfil,
  paiements,
  sauverPaiements,
  retour,
}: {
  profil: Profil;
  sauverProfil: (profil: Profil) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  retour: () => void;
}) {
  const [form, setForm] = useState({ nom: "", prenom: "", tel: "", email: "" });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  const handleInscription = () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.tel.trim()) {
      setErreur("Veuillez remplir le nom, le pr\u00e9nom et le t\u00e9l\u00e9phone.");
      return;
    }

    const codeMembre = creerId("MBR");

    sauverPaiements([
      ...paiements,
      creerPaiement({
        id: creerId("p"),
        proprietaire: codeMembre,
        libelle: "Inscription annuelle membre",
        montant: TARIFS.membre.inscription,
        statut: "En attente",
      }),
    ]);

    sauverProfil({
      type: "membre",
      code: codeMembre,
      nom: form.nom,
      prenom: form.prenom,
      tel: form.tel,
      email: form.email || undefined,
      abonnementInscription: true,
    });

    setSucces(true);
    setTimeout(() => retour(), 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      <BoutonRetour onClick={retour} />
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mt-4">
        <div className="text-center mb-6">
          <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
            <UserPlus size={28} />
          </div>
          <h2 className="text-2xl font-bold">Devenir membre</h2>
          <p className="text-zinc-400 text-sm mt-1">Acc\u00e8s illimit\u00e9 \u00e0 tous nos services</p>
        </div>

        {succes ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 text-center">
            <Check size={32} className="mx-auto mb-2" />
            <div className="font-bold mb-1">Inscription r\u00e9ussie !</div>
            <div className="text-sm">Bienvenue \u00e0 Elite Gym, {form.prenom} !</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Pr\u00e9nom *</label>
              <input
                value={form.prenom}
                onChange={(e) => { setForm({ ...form, prenom: e.target.value }); setErreur(""); }}
                placeholder="Jean"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nom *</label>
              <input
                value={form.nom}
                onChange={(e) => { setForm({ ...form, nom: e.target.value }); setErreur(""); }}
                placeholder="Dupont"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">T\u00e9l\u00e9phone *</label>
              <input
                value={form.tel}
                onChange={(e) => { setForm({ ...form, tel: e.target.value }); setErreur(""); }}
                placeholder="+221 77 123 45 67"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email (optionnel)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setErreur(""); }}
                placeholder="jean@exemple.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mt-5">
              <div className="font-bold text-amber-400 mb-1">Frais d'inscription annuelle</div>
              <div className="text-2xl font-black">{fmt(TARIFS.membre.inscription)}</div>
              <div className="text-xs text-zinc-400 mt-2">Valable 12 mois \u00b7 Acc\u00e8s au tarif membre</div>
            </div>

            {erreur && <p className="text-red-400 text-sm">{erreur}</p>}

            <button
              onClick={handleInscription}
              className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-4">
              S'inscrire pour {fmt(TARIFS.membre.inscription)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
