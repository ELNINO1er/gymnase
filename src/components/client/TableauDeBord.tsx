import { useState } from "react";
import { Calendar, Check, Clock, CreditCard, LogOut, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { Paiement, Profil, Reservation, Tarifs } from "../../types";
import { CRENEAUX, TYPES_SEANCE } from "../../utils/constants";
import { creerId, creerLienPaiementWave, creerPaiement, fmt, identifiantProfil } from "../../utils/helpers";
import { Onglet, WaveLogo, useConfirm } from "../ui";

export function TableauDeBord({
  type,
  profil,
  sauverProfil,
  reservations,
  sauverReservations,
  paiements,
  sauverPaiements,
  tarifs,
  retour,
  deconnexion,
}: {
  type: "membre" | "visiteur";
  profil: Profil;
  sauverProfil: (profil: Profil) => void;
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  tarifs: Tarifs;
  retour: () => void;
  deconnexion: () => void;
}) {
  const [onglet, setOnglet] = useState("reserver");
  const identifiant = identifiantProfil(profil);
  const mesReservations = reservations.filter((r) => r.proprietaire === identifiant);
  const mesPaiements = paiements.filter((p) => p.proprietaire === identifiant);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-zinc-400 text-sm">Bienvenue,</div>
          <h2 className="text-2xl font-bold">{profil.prenom || "Membre"} {profil.nom}</h2>
          <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${type === "membre" ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
            {type === "membre" ? "Membre" : "Visiteur"}
          </span>
        </div>
        <button onClick={deconnexion} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition">
          <LogOut size={16} /> Quitter
        </button>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
        <Onglet actif={onglet === "reserver"} onClick={() => setOnglet("reserver")} icone={<Calendar size={16} />} label="R\u00e9server" />
        <Onglet actif={onglet === "seances"} onClick={() => setOnglet("seances")} icone={<Clock size={16} />} label={`Mes s\u00e9ances (${mesReservations.length})`} />
        {type === "membre" && (
          <Onglet actif={onglet === "inscription"} onClick={() => setOnglet("inscription")} icone={<ShieldCheck size={16} />} label="Inscription" />
        )}
        <Onglet actif={onglet === "paiements"} onClick={() => setOnglet("paiements")} icone={<CreditCard size={16} />} label="Historique" />
      </div>

      {onglet === "reserver" && (
        <FormulaireReservation
          type={type}
          tarifs={tarifs}
          idProp={identifiant}
          reservations={reservations}
          sauverReservations={sauverReservations}
          paiements={paiements}
          sauverPaiements={sauverPaiements}
          allerAuxSeances={() => setOnglet("seances")}
        />
      )}
      {onglet === "seances" && (
        <MesSeances
          mesReservations={mesReservations}
          reservations={reservations}
          sauverReservations={sauverReservations}
          paiements={paiements}
          sauverPaiements={sauverPaiements}
          reserver={() => setOnglet("reserver")}
        />
      )}
      {onglet === "inscription" && type === "membre" && (
        <InscriptionMembre tarifs={tarifs} idProp={identifiant} profil={profil} sauverProfil={sauverProfil} paiements={paiements} sauverPaiements={sauverPaiements} />
      )}
      {onglet === "paiements" && <Historique mesPaiements={mesPaiements} />}
    </div>
  );
}

function FormulaireReservation({
  type,
  tarifs,
  idProp,
  reservations,
  sauverReservations,
  paiements,
  sauverPaiements,
  allerAuxSeances,
}: {
  type: "membre" | "visiteur";
  tarifs: Tarifs;
  idProp: string;
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  allerAuxSeances: () => void;
}) {
  const [typeSeance, setTypeSeance] = useState(TYPES_SEANCE[0].id);
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState("");
  const [confirme, setConfirme] = useState(false);
  const [paiementWave, setPaiementWave] = useState<Paiement | null>(null);

  const auj = new Date().toISOString().split("T")[0];
  // FIX: Only block slots for the same session type on the same date
  const prisPourDate = reservations
    .filter((r) => r.date === date && r.proprietaire === idProp)
    .map((r) => r.creneau);
  const seanceInfo = TYPES_SEANCE.find((t) => t.id === typeSeance);

  const confirmer = () => {
    if (!date || !creneau || !seanceInfo) return;

    const reservationId = creerId("r");
    const nouvelle: Reservation = {
      id: reservationId,
      proprietaire: idProp,
      type: seanceInfo.nom,
      icone: seanceInfo.icone,
      date,
      creneau,
      prix: tarifs.seance,
      cree: Date.now(),
    };

    const paiement = creerPaiement({
      id: creerId("p"),
      proprietaire: idProp,
      reservationId,
      libelle: `S\u00e9ance ${seanceInfo.nom} - ${date} ${creneau}`,
      montant: tarifs.seance,
      statut: "En attente",
    });

    sauverReservations([...reservations, nouvelle]);
    sauverPaiements([...paiements, paiement]);
    setPaiementWave(paiement);
    setConfirme(true);
  };

  if (confirme && seanceInfo) {
    return (
      <div className="bg-zinc-900 border border-amber-400/30 rounded-2xl p-8 text-center">
        <div className="inline-flex bg-amber-400 text-zinc-950 p-3 rounded-full mb-4">
          <Check size={28} />
        </div>
        <h3 className="text-2xl font-bold mb-2">S\u00e9ance r\u00e9serv\u00e9e !</h3>
        <p className="text-zinc-400 mb-1">{seanceInfo.nom}</p>
        <p className="text-zinc-300 font-medium mb-1">{date} \u00e0 {creneau}</p>
        <p className="text-amber-400 font-bold text-lg mb-6">{fmt(tarifs.seance)}</p>
        {paiementWave && (
          <a
            href={creerLienPaiementWave(paiementWave.montant, paiementWave.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const paiementLance = { ...paiementWave, statut: "Paiement Wave lanc\u00e9" };
              const existe = paiements.some((p) => p.id === paiementWave.id);
              sauverPaiements(existe ? paiements.map((p) => (p.id === paiementWave.id ? paiementLance : p)) : [...paiements, paiementLance]);
              setPaiementWave(paiementLance);
            }}
            className="inline-flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 text-zinc-950 px-5 py-3 rounded-lg font-black transition mb-5">
            <WaveLogo size={22} /> Payer avec Wave
          </a>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setConfirme(false); setDate(""); setCreneau(""); }} className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-lg font-medium transition">Nouvelle r\u00e9servation</button>
          <button onClick={allerAuxSeances} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 px-5 py-2.5 rounded-lg font-bold transition">Voir mes s\u00e9ances</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-5">Programmer une s\u00e9ance</h3>
      <label className="block text-sm font-medium text-zinc-300 mb-2">Type de s\u00e9ance</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {TYPES_SEANCE.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeSeance(t.id)}
            className={`p-3 rounded-xl border text-center transition ${
              typeSeance === t.id ? "border-amber-400 bg-amber-400/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-600"
            }`}>
            <div className="text-2xl mb-1">{t.icone}</div>
            <div className="text-xs font-medium">{t.nom}</div>
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-zinc-300 mb-2">Date</label>
      <input
        type="date"
        min={auj}
        value={date}
        onChange={(e) => { setDate(e.target.value); setCreneau(""); }}
        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-5 text-zinc-100"
        style={{ colorScheme: "dark" }}
      />

      {date && (
        <>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Cr\u00e9neau horaire</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
            {CRENEAUX.map((c) => {
              const pris = prisPourDate.includes(c);
              return (
                <button
                  key={c}
                  disabled={pris}
                  onClick={() => setCreneau(c)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${
                    pris
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed line-through"
                      : creneau === c
                      ? "bg-amber-400 text-zinc-950"
                      : "bg-zinc-950 border border-zinc-700 hover:border-amber-400"
                  }`}>
                  {c}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center justify-between bg-zinc-950 rounded-xl p-4 mb-4">
        <span className="text-zinc-400">Montant de la s\u00e9ance</span>
        <span className="text-2xl font-black text-amber-400">{fmt(tarifs.seance)}</span>
      </div>

      <button
        onClick={confirmer}
        disabled={!date || !creneau}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold py-3.5 rounded-lg transition">
        Confirmer la r\u00e9servation
      </button>
    </div>
  );
}

function MesSeances({ mesReservations, reservations, sauverReservations, paiements, sauverPaiements, reserver }: {
  mesReservations: Reservation[];
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  reserver: () => void;
}) {
  const { confirm, dialog } = useConfirm();
  const triees = [...mesReservations].sort((a, b) => (a.date + a.creneau).localeCompare(b.date + b.creneau));

  const annuler = (id: string) => {
    confirm("Voulez-vous vraiment annuler cette s\u00e9ance ?", () => {
      sauverReservations(reservations.filter((r) => r.id !== id));
      sauverPaiements(paiements.map((p) => (p.reservationId === id ? { ...p, statut: "Annul\u00e9" } : p)));
    });
  };

  if (triees.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <Calendar className="mx-auto text-zinc-600 mb-3" size={40} />
        <p className="text-zinc-400 mb-4">Vous n'avez aucune s\u00e9ance programm\u00e9e.</p>
        <button onClick={reserver} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition inline-flex items-center gap-2">
          <Plus size={18} /> R\u00e9server une s\u00e9ance
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dialog}
      {triees.map((r) => (
        <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl">{r.icone}</div>
          <div className="flex-1">
            <div className="font-bold">{r.type}</div>
            <div className="text-sm text-zinc-400 flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1"><Calendar size={14} /> {r.date}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {r.creneau}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-amber-400">{fmt(r.prix)}</div>
            <button onClick={() => annuler(r.id)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mt-1 ml-auto">
              <Trash2 size={14} /> Annuler
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InscriptionMembre({
  tarifs,
  idProp,
  profil,
  sauverProfil,
  paiements,
  sauverPaiements,
}: {
  tarifs: Tarifs;
  idProp: string;
  profil: Profil;
  sauverProfil: (profil: Profil) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
}) {
  const [msg, setMsg] = useState("");
  const inscription = tarifs.inscription;

  return (
    <div>
      {!profil.abonnementInscription && (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-bold text-amber-400">Inscription annuelle</div>
            <div className="text-sm text-zinc-400">Acc\u00e8s membre pour 1 an - {fmt(inscription)}</div>
          </div>
          <button
            onClick={() => {
              sauverPaiements([
                ...paiements,
                creerPaiement({
                  id: creerId("p"),
                  proprietaire: idProp,
                  libelle: "Inscription annuelle membre",
                  montant: inscription,
                  statut: "En attente",
                }),
              ]);
              sauverProfil({ ...profil, abonnementInscription: true });
              setMsg("Inscription annuelle enregistr\u00e9e !");
              setTimeout(() => setMsg(""), 5000);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg transition text-sm">
            Souscrire
          </button>
        </div>
      )}

      {msg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 mb-5 text-sm flex items-center gap-2">
          <Check size={16} /> {msg}
        </div>
      )}

      {profil.abonnementInscription && (
        <div className="bg-zinc-900 border border-amber-400/30 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Inscription active</div>
          <div className="font-bold text-lg">Membre annuel</div>
          <div className="text-sm text-zinc-400">Les s\u00e9ances se paient une par une.</div>
        </div>
      )}
    </div>
  );
}

function Historique({ mesPaiements }: { mesPaiements: Paiement[] }) {
  const tries = [...mesPaiements].reverse();
  // FIX: Only count payments that are actually paid for the total
  const totalPaye = mesPaiements.filter((p) => p.statut === "Pay\u00e9").reduce((s, p) => s + p.montant, 0);
  const totalEnAttente = mesPaiements.filter((p) => p.statut === "En attente" || p.statut === "Paiement Wave lanc\u00e9").reduce((s, p) => s + p.montant, 0);

  if (tries.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <CreditCard className="mx-auto text-zinc-600 mb-3" size={40} />
        <p className="text-zinc-400">Aucun paiement enregistr\u00e9 pour l'instant.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-zinc-400">Total pay\u00e9</span>
          <span className="text-2xl font-black text-green-400">{fmt(totalPaye)}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-zinc-400">En attente</span>
          <span className="text-2xl font-black text-amber-400">{fmt(totalEnAttente)}</span>
        </div>
      </div>
      <div className="space-y-2">
        {tries.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.libelle}</div>
              <div className="text-sm text-zinc-500">{p.date}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">{fmt(p.montant)}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                p.statut === "Pay\u00e9" ? "bg-green-500/10 text-green-400" :
                p.statut === "Annul\u00e9" ? "bg-red-500/10 text-red-400" :
                "bg-amber-400/10 text-amber-400"
              }`}>{p.statut}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
