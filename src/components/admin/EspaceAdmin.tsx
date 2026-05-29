import { useEffect, useState } from "react";
import { Bell, Calendar, Clock, CreditCard, Home, LogOut, ShieldCheck, Trash2, Users } from "lucide-react";
import type { Paiement, Profil, Reservation } from "../../types";
import { CODE_ADMIN } from "../../utils/constants";
import { dateIsoAujourdhui, fmt, formatDateFr, identifiantProfil } from "../../utils/helpers";
import { Onglet, Stat, useConfirm } from "../ui";

function SectionAdmin({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h3 className="font-bold text-lg mb-4">{titre}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Vide({ texte }: { texte: string }) {
  return <p className="text-zinc-400 text-sm text-center py-8">{texte}</p>;
}

function LigneSeance({ reservation, profil, onAnnuler }: { reservation: Reservation; profil?: Profil; onAnnuler: () => void }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-bold">{reservation.icone} {reservation.type}</div>
        <div className="text-sm text-zinc-400">{reservation.date} \u00e0 {reservation.creneau} \u00b7 {fmt(reservation.prix)}</div>
        <div className="text-sm text-zinc-500">{profil ? `${profil.prenom || ""} ${profil.nom || ""}`.trim() || reservation.proprietaire : reservation.proprietaire}</div>
      </div>
      <button onClick={onAnnuler} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
        <Trash2 size={14} /> Annuler
      </button>
    </div>
  );
}

function LignePaiement({ paiement, profil, onStatut }: { paiement: Paiement; profil?: Profil; onStatut: (id: string, statut: string) => void }) {
  const couleur = paiement.statut === "Pay\u00e9" ? "text-green-400 bg-green-500/10" : paiement.statut === "Annul\u00e9" ? "text-red-400 bg-red-500/10" : "text-amber-400 bg-amber-400/10";

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{paiement.libelle}</div>
          <div className="text-sm text-zinc-500">{profil ? `${profil.prenom || ""} ${profil.nom || ""}`.trim() || paiement.proprietaire : paiement.proprietaire} \u00b7 {paiement.date}</div>
        </div>
        <div className="text-right">
          <div className="font-bold">{fmt(paiement.montant)}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${couleur}`}>{paiement.statut}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => onStatut(paiement.id, "Pay\u00e9")} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium">Pay\u00e9</button>
        <button onClick={() => onStatut(paiement.id, "En attente")} className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 px-3 py-1.5 rounded-lg text-sm font-medium">En attente</button>
        <button onClick={() => onStatut(paiement.id, "Annul\u00e9")} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium">Annul\u00e9</button>
      </div>
    </div>
  );
}

export function EspaceAdmin({
  profils,
  sauverProfils,
  reservations,
  sauverReservations,
  paiements,
  sauverPaiements,
}: {
  profils: Profil[];
  sauverProfils: (profils: Profil[]) => void;
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
}) {
  const { confirm, dialog } = useConfirm();
  const [connecte, setConnecte] = useState(false);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState("vue");
  const [datePoint, setDatePoint] = useState(dateIsoAujourdhui());
  const [derniereReservationVue, setDerniereReservationVue] = useState(() =>
    Number(window.localStorage.getItem("adminDerniereReservationVue") || "0")
  );

  const totalEncaisse = paiements.filter((p) => p.statut === "Pay\u00e9").reduce((s, p) => s + p.montant, 0);
  const totalAttente = paiements.filter((p) => p.statut === "En attente" || p.statut === "Paiement Wave lanc\u00e9").reduce((s, p) => s + p.montant, 0);
  const seancesTriees = [...reservations].sort((a, b) => (a.date + a.creneau).localeCompare(b.date + b.creneau));
  const nouvellesReservations = reservations.filter((r) => r.cree > derniereReservationVue).sort((a, b) => b.cree - a.cree);
  const derniereNouvelleReservation = nouvellesReservations[0];
  const paiementsDuJour = paiements.filter((p) => (p.dateIso ? p.dateIso === datePoint : p.date === formatDateFr(datePoint)));
  const seancesDuJour = seancesTriees.filter((r) => r.date === datePoint);
  const encaisseDuJour = paiementsDuJour.filter((p) => p.statut === "Pay\u00e9").reduce((s, p) => s + p.montant, 0);
  const attenteDuJour = paiementsDuJour.filter((p) => p.statut === "En attente" || p.statut === "Paiement Wave lanc\u00e9").reduce((s, p) => s + p.montant, 0);

  const profilParId = (id: string) => profils.find((p) => identifiantProfil(p) === id);

  const changerStatut = (id: string, statut: string) => {
    sauverPaiements(paiements.map((p) => (p.id === id ? { ...p, statut } : p)));
  };

  const annulerSeance = (id: string) => {
    confirm("Voulez-vous vraiment annuler cette s\u00e9ance ?", () => {
      sauverReservations(reservations.filter((r) => r.id !== id));
      sauverPaiements(paiements.map((p) => (p.reservationId === id ? { ...p, statut: "Annul\u00e9" } : p)));
    });
  };

  const supprimerProfil = (id: string) => {
    confirm("Voulez-vous vraiment supprimer ce profil ?", () => {
      sauverProfils(profils.filter((p) => identifiantProfil(p) !== id));
    });
  };

  const marquerReservationsCommeVues = () => {
    const prochainRepere = Math.max(Date.now(), ...reservations.map((r) => r.cree));
    setDerniereReservationVue(prochainRepere);
    window.localStorage.setItem("adminDerniereReservationVue", String(prochainRepere));
  };

  useEffect(() => {
    if (!connecte || nouvellesReservations.length === 0) {
      document.title = "Elite Gym - Gym App";
      return;
    }

    document.title = `(${nouvellesReservations.length}) Nouvelle s\u00e9ance - Elite Gym`;
    return () => {
      document.title = "Elite Gym - Gym App";
    };
  }, [connecte, nouvellesReservations.length]);

  if (!connecte) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mt-4">
          <div className="text-center mb-6">
            <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-bold">Administration</h2>
            <p className="text-zinc-400 text-sm mt-1">Entrez le code administrateur pour g\u00e9rer la salle</p>
          </div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Code admin</label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setErreur("");
            }}
            placeholder="Code administrateur"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-1 tracking-widest font-mono"
          />
          {erreur && <p className="text-red-400 text-sm mb-2">{erreur}</p>}
          <button
            onClick={() => {
              if (code.trim() === CODE_ADMIN) {
                setConnecte(true);
              } else {
                setErreur("Code invalide.");
              }
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-3">
            Ouvrir le tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-zinc-400 text-sm">Tableau de bord</div>
          <h2 className="text-2xl font-bold">Administration Elite Gym</h2>
        </div>
        <button onClick={() => setConnecte(false)} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition">
          <LogOut size={16} /> Quitter
        </button>
      </div>

      {nouvellesReservations.length > 0 && (
        <div className="bg-amber-400/10 border border-amber-400/40 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-400 text-zinc-950 p-2 rounded-xl">
              <Bell size={20} />
            </div>
            <div>
              <div className="font-bold text-amber-400">
                {nouvellesReservations.length} nouvelle{nouvellesReservations.length > 1 ? "s" : ""} s\u00e9ance{nouvellesReservations.length > 1 ? "s" : ""} programm\u00e9e{nouvellesReservations.length > 1 ? "s" : ""}
              </div>
              {derniereNouvelleReservation && (
                <div className="text-sm text-zinc-300 mt-1">
                  Derni\u00e8re r\u00e9servation : {derniereNouvelleReservation.type} le {derniereNouvelleReservation.date} \u00e0 {derniereNouvelleReservation.creneau}
                </div>
              )}
            </div>
          </div>
          <button onClick={marquerReservationsCommeVues} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg transition text-sm">
            Marquer comme lu
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat titre="Inscrits" valeur={String(profils.length)} />
        <Stat titre="S\u00e9ances pr\u00e9vues" valeur={String(reservations.length)} />
        <Stat titre="Pay\u00e9" valeur={fmt(totalEncaisse)} />
        <Stat titre="En attente" valeur={fmt(totalAttente)} />
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
        <Onglet actif={onglet === "vue"} onClick={() => setOnglet("vue")} icone={<Home size={16} />} label="Vue g\u00e9n\u00e9rale" />
        <Onglet actif={onglet === "jour"} onClick={() => setOnglet("jour")} icone={<Clock size={16} />} label="Point du jour" />
        <Onglet actif={onglet === "inscrits"} onClick={() => setOnglet("inscrits")} icone={<Users size={16} />} label={`Inscrits (${profils.length})`} />
        <Onglet actif={onglet === "seances"} onClick={() => setOnglet("seances")} icone={<Calendar size={16} />} label={`S\u00e9ances (${reservations.length})`} />
        <Onglet actif={onglet === "transactions"} onClick={() => setOnglet("transactions")} icone={<CreditCard size={16} />} label={`Transactions (${paiements.length})`} />
      </div>

      {onglet === "vue" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionAdmin titre="Prochaines s\u00e9ances">
            {seancesTriees.slice(0, 5).length === 0 ? (
              <Vide texte="Aucune s\u00e9ance programm\u00e9e." />
            ) : (
              seancesTriees.slice(0, 5).map((r) => <LigneSeance key={r.id} reservation={r} profil={profilParId(r.proprietaire)} onAnnuler={() => annulerSeance(r.id)} />)
            )}
          </SectionAdmin>
          <SectionAdmin titre="Derni\u00e8res transactions">
            {[...paiements].reverse().slice(0, 5).length === 0 ? (
              <Vide texte="Aucune transaction enregistr\u00e9e." />
            ) : (
              [...paiements].reverse().slice(0, 5).map((p) => <LignePaiement key={p.id} paiement={p} profil={profilParId(p.proprietaire)} onStatut={changerStatut} />)
            )}
          </SectionAdmin>
        </div>
      )}

      {onglet === "jour" && (
        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Choisir la journ\u00e9e</label>
            <input
              type="date"
              value={datePoint}
              onChange={(e) => setDatePoint(e.target.value)}
              className="w-full sm:w-64 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none text-zinc-100"
              style={{ colorScheme: "dark" }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat titre="S\u00e9ances du jour" valeur={String(seancesDuJour.length)} />
            <Stat titre="Transactions du jour" valeur={String(paiementsDuJour.length)} />
            <Stat titre="Pay\u00e9 ce jour" valeur={fmt(encaisseDuJour)} />
            <Stat titre="En attente ce jour" valeur={fmt(attenteDuJour)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <SectionAdmin titre={`S\u00e9ances du ${formatDateFr(datePoint)}`}>
              {seancesDuJour.length === 0 ? (
                <Vide texte="Aucune s\u00e9ance programm\u00e9e pour cette journ\u00e9e." />
              ) : (
                seancesDuJour.map((r) => <LigneSeance key={r.id} reservation={r} profil={profilParId(r.proprietaire)} onAnnuler={() => annulerSeance(r.id)} />)
              )}
            </SectionAdmin>
            <SectionAdmin titre={`Argent du ${formatDateFr(datePoint)}`}>
              {paiementsDuJour.length === 0 ? (
                <Vide texte="Aucune transaction pour cette journ\u00e9e." />
              ) : (
                [...paiementsDuJour].reverse().map((p) => <LignePaiement key={p.id} paiement={p} profil={profilParId(p.proprietaire)} onStatut={changerStatut} />)
              )}
            </SectionAdmin>
          </div>
        </div>
      )}

      {onglet === "inscrits" && (
        <SectionAdmin titre="Clients inscrits et visiteurs identifi\u00e9s">
          {profils.length === 0 ? (
            <Vide texte="Aucun inscrit pour le moment." />
          ) : (
            profils.map((p) => (
              <div key={identifiantProfil(p)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold">{p.prenom || "Sans pr\u00e9nom"} {p.nom}</div>
                  <div className="text-sm text-zinc-400">{p.type === "membre" ? "Membre" : "Visiteur"} \u00b7 {p.code || identifiantProfil(p)}</div>
                  <div className="text-sm text-zinc-500">{p.email || "Email non renseign\u00e9"} \u00b7 {p.tel || "T\u00e9l\u00e9phone non renseign\u00e9"}</div>
                </div>
                <button onClick={() => supprimerProfil(identifiantProfil(p))} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            ))
          )}
        </SectionAdmin>
      )}

      {onglet === "seances" && (
        <SectionAdmin titre="Toutes les s\u00e9ances programm\u00e9es">
          {seancesTriees.length === 0 ? <Vide texte="Aucune s\u00e9ance programm\u00e9e." /> : seancesTriees.map((r) => <LigneSeance key={r.id} reservation={r} profil={profilParId(r.proprietaire)} onAnnuler={() => annulerSeance(r.id)} />)}
        </SectionAdmin>
      )}

      {onglet === "transactions" && (
        <SectionAdmin titre="Gestion des transactions">
          {paiements.length === 0 ? <Vide texte="Aucune transaction enregistr\u00e9e." /> : [...paiements].reverse().map((p) => <LignePaiement key={p.id} paiement={p} profil={profilParId(p.proprietaire)} onStatut={changerStatut} />)}
        </SectionAdmin>
      )}
    </div>
  );
}
