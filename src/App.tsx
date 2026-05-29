import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Download,
  Dumbbell,
  Home,
  LogOut,
  Plus,
  QrCode,
  ShieldCheck,
  Star,
  Trash2,
  User,
  UserPlus,
  Users,
  ChevronRight,
} from "lucide-react";

type Tarifs = {
  seance: number;
  inscription: number;
};

const TARIFS: { membre: Tarifs; visiteur: Tarifs } = {
  membre: {
    seance: 2000,
    inscription: 10000,
  },
  visiteur: {
    seance: 3000,
    inscription: 0,
  },
};

const TYPES_SEANCE = [
  { id: "muscu", nom: "Musculation", icone: "💪" },
  { id: "cardio", nom: "Cardio / HIIT", icone: "🏃" },
  { id: "cours", nom: "Cours collectif", icone: "🧘" },
  { id: "coach", nom: "Coaching privé", icone: "🎯" },
];

const CRENEAUX = ["06:00", "07:30", "09:00", "10:30", "12:00", "14:00", "16:00", "17:30", "19:00", "20:30"];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const dateIsoAujourdhui = () => {
  const date = new Date();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
};
const formatDateFr = (dateIso: string) => new Date(`${dateIso}T00:00:00`).toLocaleDateString("fr-FR");
const CODE_DEMO = "ELITE2024";
const CODE_ADMIN = "ADMIN2024";
const WAVE_PAYMENT_LINK = "https://pay.wave.com/m/elite-gym-demo";

const creerLienPaiementWave = (montant: number, reference: string) => {
  const params = new URLSearchParams({
    amount: String(montant),
    currency: "XOF",
    reference,
  });
  return `${WAVE_PAYMENT_LINK}?${params.toString()}`;
};

const WaveLogo = ({ size = 24 }: { size?: number }) => (
  <span
    aria-hidden="true"
    className="inline-flex shrink-0 items-center justify-start overflow-hidden rounded-md shadow-sm"
    style={{ width: size, height: size }}>
    <img
      src="/wave-nav-logo.png"
      alt=""
      className="block h-full max-w-none"
      style={{ width: "auto" }}
    />
  </span>
);

const store = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("storage set", e);
    }
  },
};

type Profil = {
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

type Reservation = {
  id: string;
  proprietaire: string;
  type: string;
  icone: string;
  date: string;
  creneau: string;
  prix: number;
  cree: number;
};

type Paiement = {
  id: string;
  proprietaire: string;
  reservationId?: string;
  libelle: string;
  montant: number;
  date: string;
  dateIso?: string;
  statut: string;
};

const creerPaiement = (paiement: Omit<Paiement, "date" | "dateIso">): Paiement => {
  const dateIso = dateIsoAujourdhui();
  return { ...paiement, dateIso, date: formatDateFr(dateIso) };
};

const creerId = (prefixe: string) => `${prefixe}${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const identifiantProfil = (profil: Profil) => {
  if (profil.code?.trim()) return profil.code.trim().toUpperCase();
  if (profil.email?.trim()) return `EMAIL:${profil.email.trim().toLowerCase()}`;
  return `${profil.type || "profil"}:${profil.prenom || ""}:${profil.nom || ""}`.toLowerCase();
};

const fusionnerProfil = (profils: Profil[], profil: Profil) => {
  const id = identifiantProfil(profil);
  const dejaInscrit = profils.find((p) => identifiantProfil(p) === id);
  const profilAvecDate = { ...dejaInscrit, ...profil, inscritLe: dejaInscrit?.inscritLe || profil.inscritLe || new Date().toLocaleDateString("fr-FR") };
  return [...profils.filter((p) => identifiantProfil(p) !== id), profilAvecDate];
};

const lireEspace = () => (window.location.hash === "#/admin" || window.location.pathname === "/admin" ? "admin" : "client");

export default function App() {
  const [vue, setVue] = useState("accueil");
  const [espace, setEspace] = useState(lireEspace);
  const [chargement, setChargement] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profil, setProfil] = useState<Profil>({ type: null });
  const [profils, setProfils] = useState<Profil[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  useEffect(() => {
    (async () => {
      const reservationsStockees = await store.get<Reservation[]>("reservations", []);
      const profilStocke = await store.get<Profil>("profil", { type: null });
      let profilsStockes = await store.get<Profil[]>("profils", []);
      const paiementsStockes = await store.get<Paiement[]>("paiements", []);

      if (profilStocke.type) {
        profilsStockes = fusionnerProfil(profilsStockes, profilStocke);
        store.set("profils", profilsStockes);
      }

      setReservations(reservationsStockees);
      setProfil(profilStocke);
      setProfils(profilsStockes);
      setPaiements(paiementsStockes);
      setChargement(false);
    })();
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

  if (chargement) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse flex items-center gap-2">
          <Dumbbell className="animate-bounce" /> Chargement⬦
        </div>
      </div>
    );
  }

  if (espace === "admin") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
        <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xl tracking-tight">
              <span className="bg-amber-400 text-zinc-950 p-1.5 rounded-lg">
                <ShieldCheck size={20} />
              </span>
              <span>
                Elite <span className="text-amber-400">Admin</span>
              </span>
            </div>
            <button
              onClick={() => {
                window.location.hash = "";
                setEspace("client");
                setVue("accueil");
              }}
              className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-zinc-800 transition">
              <Home size={16} /> Client
            </button>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <EspaceAdmin
            profils={profils}
            sauverProfils={sauverProfils}
            reservations={reservations}
            sauverReservations={sauverReservations}
            paiements={paiements}
            sauverPaiements={sauverPaiements}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setVue("accueil")} className="flex items-center gap-3 font-black text-2xl tracking-tight">
            <span className="bg-amber-400 text-zinc-950 p-2 rounded-lg">
              <Dumbbell size={24} />
            </span>
            <span>
              ELITE <span className="text-amber-400">GYM</span>
            </span>
          </button>
          <div className="flex items-center gap-1">
            <NavBtn actif={vue === "accueil"} onClick={() => setVue("accueil")} icone={<Home size={16} />} label="Accueil" />
            <NavBtn actif={vue === "qr"} onClick={() => setVue("qr")} icone={<QrCode size={16} />} label="QR Code" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {vue === "accueil" && <Accueil setVue={setVue} />}
        {vue === "connexion" && (
          <EspaceConnexionClient
            profils={profils}
            sauverProfil={sauverProfil}
            ouvrirDossier={(type) => setVue(type === "membre" ? "membre" : "visiteur")}
            retour={() => setVue("accueil")}
          />
        )}
        {vue === "inscription" && (
          <EspaceInscription
            profil={profil}
            sauverProfil={sauverProfil}
            paiements={paiements}
            sauverPaiements={sauverPaiements}
            retour={() => setVue("accueil")}
          />
        )}
        {vue === "membre" && (
          <EspaceMembre
            profil={profil}
            profils={profils}
            sauverProfil={sauverProfil}
            reservations={reservations}
            sauverReservations={sauverReservations}
            paiements={paiements}
            sauverPaiements={sauverPaiements}
            retour={() => setVue("accueil")}
          />
        )}
        {vue === "visiteur" && (
          <EspaceVisiteur
            profil={profil}
            sauverProfil={sauverProfil}
            reservations={reservations}
            sauverReservations={sauverReservations}
            paiements={paiements}
            sauverPaiements={sauverPaiements}
            retour={() => setVue("accueil")}
          />
        )}
        {vue === "qr" && <GenerateurQR />}
      </main>

      <footer className="border-t border-zinc-800 mt-12 py-6 text-center text-zinc-500 text-sm">
        Elite Gym · Salle de gym · Démonstration interactive
      </footer>
    </div>
  );
}

function NavBtn({ actif, onClick, icone, label }: { actif: boolean; onClick: () => void; icone: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
        actif ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}>
      {icone}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Accueil({ setVue }: { setVue: (vue: string) => void }) {
  return (
    <div>
      <section className="text-center py-12 sm:py-20">
        <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <Star size={14} /> Votre salle de gym nouvelle génération
        </div>
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-4 rounded-2xl border border-amber-400/40 bg-zinc-900 px-5 py-4 shadow-lg shadow-amber-400/10">
            <span className="bg-amber-400 text-zinc-950 p-3 rounded-xl">
              <Dumbbell size={34} />
            </span>
            <div className="text-left leading-none">
              <div className="text-4xl sm:text-6xl font-black tracking-tight">ELITE</div>
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-amber-400">GYM</div>
            </div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
          Réservez. Entraînez-vous.
          <span className="block text-amber-400">Dépassez-vous.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
          Inscription, programmation de séances et paiement à la séance, le tout en quelques clics.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => setVue("membre")}
            className="group bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl p-6 text-left transition">
            <User className="mb-3" size={28} />
            <div className="font-bold text-lg">Je suis membre</div>
            <div className="text-sm text-zinc-800 mb-3">Connectez-vous avec votre code d'accès</div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              Accéder <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => setVue("inscription")}
            className="group bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl p-6 text-left transition">
            <UserPlus className="mb-3" size={28} />
            <div className="font-bold text-lg">M'inscrire</div>
            <div className="text-sm text-zinc-600 mb-3">Devenir membre et profiter du tarif membre</div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              Commencer <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => setVue("visiteur")}
            className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-6 text-left transition">
            <UserPlus className="mb-3 text-amber-400" size={28} />
            <div className="font-bold text-lg">Réserver sans s'inscrire</div>
            <div className="text-sm text-zinc-400 mb-3">Une ou plusieurs séances ponctuelles</div>
            <div className="flex items-center gap-1 font-semibold text-sm text-amber-400">
              Commencer <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </button>
        </div>
        <button
          onClick={() => setVue("connexion")}
          className="inline-flex items-center gap-2 mt-6 text-amber-400 hover:text-amber-300 font-semibold text-sm transition">
          <Users size={16} /> Retrouver mon dossier
        </button>
      </section>

      <section className="py-8">
        <h2 className="text-2xl font-bold text-center mb-8">Nos tarifs</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <CarteTarif
            titre="Membres"
            badge="Le plus avantageux"
            surligne
            seance={TARIFS.membre.seance}
            extra={`+ Inscription annuelle : ${fmt(TARIFS.membre.inscription)}`}
          />
          <CarteTarif
            titre="Visiteurs"
            badge="Sans engagement"
            seance={TARIFS.visiteur.seance}
            extra="Aucun frais d'inscription"
          />
        </div>
      </section>
    </div>
  );
}

function CarteTarif({ titre, badge, surligne, seance, extra }: {
  titre: string;
  badge: string;
  surligne?: boolean;
  seance: number;
  extra: string;
}) {
  return (
    <div className={`rounded-2xl p-6 border ${surligne ? "border-amber-400 bg-amber-400/5" : "border-zinc-800 bg-zinc-900"}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{titre}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${surligne ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>{badge}</span>
      </div>
      <div className="mb-1">
        <span className="text-3xl font-black">{fmt(seance)}</span> <span className="text-zinc-400">/ séance</span>
      </div>
      <div className="text-sm text-zinc-400 mb-4">{extra}</div>
      <div className="rounded-2xl bg-zinc-950/60 p-4 mb-5 text-sm text-zinc-300">
        <div className="font-semibold text-zinc-100 mb-2">Coût indicatif par semaine et par mois</div>
        {[1, 2, 3, 4, 5].map((count) => (
          <div key={count} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-2 border-b border-zinc-900 last:border-b-0">
            <span>{count} séance{count > 1 ? "s" : ""} / semaine</span>
            <span className="text-zinc-400">Hebdo</span>
            <span className="font-bold text-right">{fmt(seance * count)}</span>
            <span className="col-start-1 col-end-2 text-zinc-400">Mensuel</span>
            <span className="col-start-2 col-end-3 text-zinc-400">4 semaines</span>
            <span className="font-bold text-right">{fmt(seance * count * 4)}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-300">
        Paiement simple : chaque séance est réservée et payée séparément.
      </div>
    </div>
  );
}

function EspaceConnexionClient({
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
      setErreur("Entrez votre code, email ou téléphone.");
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
      setErreur("Aucun dossier trouvé avec cette information.");
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
          <p className="text-zinc-400 text-sm mt-1">Utilisez votre code client, email ou téléphone.</p>
        </div>

        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Code, email ou téléphone</label>
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
          placeholder="Ex : MBR..., VIS..., email ou téléphone"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
        />

        {erreur && <p className="text-red-400 text-sm mt-2">{erreur}</p>}

        <button onClick={chercherClient} className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-4">
          Rechercher mon dossier
        </button>

        {clientTrouve && (
          <div className="bg-zinc-950 border border-amber-400/30 rounded-xl p-4 mt-5">
            <div className="text-sm text-zinc-400">Dossier trouvé</div>
            <div className="font-bold text-lg mt-1">{clientTrouve.prenom || "Client"} {clientTrouve.nom}</div>
            <div className="text-sm text-zinc-400">{clientTrouve.type === "membre" ? "Membre" : "Visiteur"} · {clientTrouve.code}</div>
            <button onClick={ouvrir} className="w-full bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 font-bold py-2.5 rounded-lg transition mt-4">
              Ouvrir mon espace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EspaceMembre({
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
            <p className="text-zinc-400 text-sm mt-1">Entrez votre code d'accès pour continuer</p>
          </div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Code d'accès</label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setErreur("");
            }}
            placeholder="Ex : ELITE2024"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-1 tracking-widest font-mono"
          />
          {erreur && <p className="text-red-400 text-sm mb-2">{erreur}</p>}
          <button
            onClick={() => {
              const codeSaisi = code.trim().toUpperCase();
              const profilExistant = profils.find((p) => p.type === "membre" && p.code?.trim().toUpperCase() === codeSaisi);

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
                setErreur("Code invalide. Essayez le code de démonstration : ELITE2024");
              }
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-3">
            Se connecter
          </button>
          <p className="text-center text-xs text-zinc-500 mt-4">
            Code de démonstration : <span className="text-amber-400 font-mono">ELITE2024</span>
          </p>
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
      deconnexion={() => sauverProfil({ ...profil, type: null })}
    />
  );
}

function EspaceInscription({
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
  const [form, setForm] = useState({ nom: "", prenom: "", tel: "" });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  const handleInscription = () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.tel.trim()) {
      setErreur("Veuillez remplir tous les champs");
      return;
    }

    // Générer un code unique pour le nouveau membre
    const codeMembre = creerId("MBR");

    // Enregistrer l'inscription
    const idInscription = creerId("p");
    sauverPaiements([
      ...paiements,
      creerPaiement({
        id: idInscription,
        proprietaire: codeMembre,
        libelle: "Inscription annuelle membre",
        montant: TARIFS.membre.inscription,
        statut: "En attente",
      }),
    ]);

    // Créer le profil membre
    sauverProfil({
      type: "membre",
      code: codeMembre,
      nom: form.nom,
      prenom: form.prenom,
      tel: form.tel,
      abonnementInscription: true,
    });

    setSucces(true);
    setTimeout(() => {
      retour();
    }, 2000);
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
          <p className="text-zinc-400 text-sm mt-1">Accès illimité à tous nos services</p>
        </div>

        {succes ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 text-center">
            <Check size={32} className="mx-auto mb-2" />
            <div className="font-bold mb-1">Inscription réussie !</div>
            <div className="text-sm">Bienvenue à Elite Gym, {form.prenom} !</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Prénom</label>
              <input
                value={form.prenom}
                onChange={(e) => {
                  setForm({ ...form, prenom: e.target.value });
                  setErreur("");
                }}
                placeholder="Jean"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nom</label>
              <input
                value={form.nom}
                onChange={(e) => {
                  setForm({ ...form, nom: e.target.value });
                  setErreur("");
                }}
                placeholder="Dupont"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Téléphone</label>
              <input
                value={form.tel}
                onChange={(e) => {
                  setForm({ ...form, tel: e.target.value });
                  setErreur("");
                }}
                placeholder="+221 77 123 45 67"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mt-5">
              <div className="font-bold text-amber-400 mb-1">Frais d'inscription annuelle</div>
              <div className="text-2xl font-black">{fmt(TARIFS.membre.inscription)}</div>
              <div className="text-xs text-zinc-400 mt-2">Valable 12 mois · Accès au tarif membre</div>
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

function EspaceVisiteur({
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
            <p className="text-zinc-400 text-sm mt-1">Quelques informations pour réserver vos séances</p>
          </div>
          <div className="space-y-3">
            <Champ label="Prénom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} />
            <Champ label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
            <Champ label="Téléphone" type="tel" value={form.tel} onChange={(v) => setForm({ ...form, tel: v })} />
          </div>
          {erreur && <p className="text-red-400 text-sm mt-2">{erreur}</p>}
          <button
            onClick={() => {
              if (!form.prenom.trim() || !form.nom.trim()) {
                setErreur("Le nom et le prénom sont obligatoires.");
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
      deconnexion={() => sauverProfil({ ...profil, type: null })}
    />
  );
}

function TableauDeBord({
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
        <Onglet actif={onglet === "reserver"} onClick={() => setOnglet("reserver")} icone={<Calendar size={16} />} label="Réserver" />
        <Onglet actif={onglet === "seances"} onClick={() => setOnglet("seances")} icone={<Clock size={16} />} label={`Mes séances (${mesReservations.length})`} />
        {type === "membre" && (
          <Onglet actif={onglet === "inscription"} onClick={() => setOnglet("inscription")} icone={<ShieldCheck size={16} />} label="Inscription" />
        )}
        <Onglet actif={onglet === "paiements"} onClick={() => setOnglet("paiements")} icone={<CreditCard size={16} />} label="Historique" />
      </div>

      {onglet === "reserver" && (
        <Reservation
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
        <MesSeSéances
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

function Onglet({ actif, onClick, icone, label }: { actif: boolean; onClick: () => void; icone: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
        actif ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
      }`}>
      {icone}
      {label}
    </button>
  );
}

function Reservation({
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
  const prisPourDate = reservations.filter((r) => r.date === date).map((r) => r.creneau);
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
      libelle: `Séance ${seanceInfo.nom} - ${date} ${creneau}`,
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
        <h3 className="text-2xl font-bold mb-2">Séance réservée !</h3>
        <p className="text-zinc-400 mb-1">{seanceInfo.nom}</p>
        <p className="text-zinc-300 font-medium mb-1">{date} à {creneau}</p>
        <p className="text-amber-400 font-bold text-lg mb-6">{fmt(tarifs.seance)}</p>
        {paiementWave && (
          <a
            href={creerLienPaiementWave(paiementWave.montant, paiementWave.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const paiementLance = { ...paiementWave, statut: "Paiement Wave lancé" };
              const existe = paiements.some((p) => p.id === paiementWave.id);
              sauverPaiements(existe ? paiements.map((p) => (p.id === paiementWave.id ? paiementLance : p)) : [...paiements, paiementLance]);
              setPaiementWave(paiementLance);
            }}
            className="inline-flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 text-zinc-950 px-5 py-3 rounded-lg font-black transition mb-5">
            <WaveLogo size={22} /> Payer avec Wave
          </a>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setConfirme(false); setDate(""); setCreneau(""); }} className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-lg font-medium transition">Nouvelle réservation</button>
          <button onClick={allerAuxSeances} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 px-5 py-2.5 rounded-lg font-bold transition">Voir mes séances</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-5">Programmer une séance</h3>
      <label className="block text-sm font-medium text-zinc-300 mb-2">Type de séance</label>
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
          <label className="block text-sm font-medium text-zinc-300 mb-2">Créneau horaire</label>
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
        <span className="text-zinc-400">Montant de la séance</span>
        <span className="text-2xl font-black text-amber-400">{fmt(tarifs.seance)}</span>
      </div>

      <button
        onClick={confirmer}
        disabled={!date || !creneau}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold py-3.5 rounded-lg transition">
        Confirmer la réservation
      </button>
    </div>
  );
}

function MesSeSéances({ mesReservations, reservations, sauverReservations, paiements, sauverPaiements, reserver }: {
  mesReservations: Reservation[];
  reservations: Reservation[];
  sauverReservations: (reservations: Reservation[]) => void;
  paiements: Paiement[];
  sauverPaiements: (paiements: Paiement[]) => void;
  reserver: () => void;
}) {
  const triees = [...mesReservations].sort((a, b) => (a.date + a.creneau).localeCompare(b.date + b.creneau));

  const annuler = (id: string) => {
    sauverReservations(reservations.filter((r) => r.id !== id));
    sauverPaiements(paiements.map((p) => (p.reservationId === id ? { ...p, statut: "Annulé" } : p)));
  };

  if (triees.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <Calendar className="mx-auto text-zinc-600 mb-3" size={40} />
        <p className="text-zinc-400 mb-4">Vous n'avez aucune séance programmée.</p>
        <button onClick={reserver} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition inline-flex items-center gap-2">
          <Plus size={18} /> Réserver une séance
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
            <div className="text-sm text-zinc-400">Accès membre pour 1 an - {fmt(inscription)}</div>
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
              setMsg("Inscription annuelle enregistrée !");
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
          <div className="text-sm text-zinc-400">Les séances se paient une par une.</div>
        </div>
      )}
    </div>
  );
}

function Historique({ mesPaiements }: { mesPaiements: Paiement[] }) {
  const tries = [...mesPaiements].reverse();
  const total = mesPaiements.filter((p) => p.statut !== "Annulé").reduce((s, p) => s + p.montant, 0);

  if (tries.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <CreditCard className="mx-auto text-zinc-600 mb-3" size={40} />
        <p className="text-zinc-400">Aucun paiement enregistré pour l'instant.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex items-center justify-between">
        <span className="text-zinc-400">Total cumulé</span>
        <span className="text-2xl font-black text-amber-400">{fmt(total)}</span>
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{p.statut}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EspaceAdmin({
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
  const [connecte, setConnecte] = useState(false);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState("vue");
  const [datePoint, setDatePoint] = useState(dateIsoAujourdhui());
  const [derniereReservationVue, setDerniereReservationVue] = useState(() => Number(window.localStorage.getItem("adminDerniereReservationVue") || "0"));

  const totalEncaisse = paiements.filter((p) => p.statut === "Payé").reduce((s, p) => s + p.montant, 0);
  const totalAttente = paiements.filter((p) => p.statut === "En attente").reduce((s, p) => s + p.montant, 0);
  const seancesTriees = [...reservations].sort((a, b) => (a.date + a.creneau).localeCompare(b.date + b.creneau));
  const nouvellesReservations = reservations.filter((r) => r.cree > derniereReservationVue).sort((a, b) => b.cree - a.cree);
  const derniereNouvelleReservation = nouvellesReservations[0];
  const paiementsDuJour = paiements.filter((p) => (p.dateIso ? p.dateIso === datePoint : p.date === formatDateFr(datePoint)));
  const seancesDuJour = seancesTriees.filter((r) => r.date === datePoint);
  const encaisseDuJour = paiementsDuJour.filter((p) => p.statut === "Payé").reduce((s, p) => s + p.montant, 0);
  const attenteDuJour = paiementsDuJour.filter((p) => p.statut === "En attente").reduce((s, p) => s + p.montant, 0);

  const profilParId = (id: string) => profils.find((p) => identifiantProfil(p) === id);

  const changerStatut = (id: string, statut: string) => {
    sauverPaiements(paiements.map((p) => (p.id === id ? { ...p, statut } : p)));
  };

  const annulerSeance = (id: string) => {
    sauverReservations(reservations.filter((r) => r.id !== id));
    sauverPaiements(paiements.map((p) => (p.reservationId === id ? { ...p, statut: "Annulé" } : p)));
  };

  const supprimerProfil = (id: string) => {
    sauverProfils(profils.filter((p) => identifiantProfil(p) !== id));
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

    document.title = `(${nouvellesReservations.length}) Nouvelle séance - Elite Gym`;
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
            <p className="text-zinc-400 text-sm mt-1">Entrez le code administrateur pour gérer la salle</p>
          </div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Code admin</label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setErreur("");
            }}
            placeholder="Ex : ADMIN2024"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-1 tracking-widest font-mono"
          />
          {erreur && <p className="text-red-400 text-sm mb-2">{erreur}</p>}
          <button
            onClick={() => {
              if (code.trim() === CODE_ADMIN) {
                setConnecte(true);
              } else {
                setErreur("Code invalide. Code de démonstration : ADMIN2024");
              }
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-lg transition mt-3">
            Ouvrir le tableau de bord
          </button>
          <p className="text-center text-xs text-zinc-500 mt-4">
            Code de démonstration : <span className="text-amber-400 font-mono">ADMIN2024</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
                {nouvellesReservations.length} nouvelle{nouvellesReservations.length > 1 ? "s" : ""} séance{nouvellesReservations.length > 1 ? "s" : ""} programmée{nouvellesReservations.length > 1 ? "s" : ""}
              </div>
              {derniereNouvelleReservation && (
                <div className="text-sm text-zinc-300 mt-1">
                  Dernière réservation : {derniereNouvelleReservation.type} le {derniereNouvelleReservation.date} à {derniereNouvelleReservation.creneau}
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
        <Stat titre="Séances prévues" valeur={String(reservations.length)} />
        <Stat titre="Payé" valeur={fmt(totalEncaisse)} />
        <Stat titre="En attente" valeur={fmt(totalAttente)} />
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
        <Onglet actif={onglet === "vue"} onClick={() => setOnglet("vue")} icone={<Home size={16} />} label="Vue générale" />
        <Onglet actif={onglet === "jour"} onClick={() => setOnglet("jour")} icone={<Clock size={16} />} label="Point du jour" />
        <Onglet actif={onglet === "inscrits"} onClick={() => setOnglet("inscrits")} icone={<Users size={16} />} label={`Inscrits (${profils.length})`} />
        <Onglet actif={onglet === "seances"} onClick={() => setOnglet("seances")} icone={<Calendar size={16} />} label={`Séances (${reservations.length})`} />
        <Onglet actif={onglet === "transactions"} onClick={() => setOnglet("transactions")} icone={<CreditCard size={16} />} label={`Transactions (${paiements.length})`} />
      </div>

      {onglet === "vue" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionAdmin titre="Prochaines séances">
            {seancesTriees.slice(0, 5).length === 0 ? (
              <Vide texte="Aucune séance programmée." />
            ) : (
              seancesTriees.slice(0, 5).map((r) => <LigneSeance key={r.id} reservation={r} profil={profilParId(r.proprietaire)} onAnnuler={() => annulerSeance(r.id)} />)
            )}
          </SectionAdmin>
          <SectionAdmin titre="Dernières transactions">
            {[...paiements].reverse().slice(0, 5).length === 0 ? (
              <Vide texte="Aucune transaction enregistrée." />
            ) : (
              [...paiements].reverse().slice(0, 5).map((p) => <LignePaiement key={p.id} paiement={p} profil={profilParId(p.proprietaire)} onStatut={changerStatut} />)
            )}
          </SectionAdmin>
        </div>
      )}

      {onglet === "jour" && (
        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Choisir la journée</label>
            <input
              type="date"
              value={datePoint}
              onChange={(e) => setDatePoint(e.target.value)}
              className="w-full sm:w-64 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none text-zinc-100"
              style={{ colorScheme: "dark" }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat titre="Séances du jour" valeur={String(seancesDuJour.length)} />
            <Stat titre="Transactions du jour" valeur={String(paiementsDuJour.length)} />
            <Stat titre="Payé ce jour" valeur={fmt(encaisseDuJour)} />
            <Stat titre="En attente ce jour" valeur={fmt(attenteDuJour)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <SectionAdmin titre={`Séances du ${formatDateFr(datePoint)}`}>
              {seancesDuJour.length === 0 ? (
                <Vide texte="Aucune séance programmée pour cette journée." />
              ) : (
                seancesDuJour.map((r) => <LigneSeance key={r.id} reservation={r} profil={profilParId(r.proprietaire)} onAnnuler={() => annulerSeance(r.id)} />)
              )}
            </SectionAdmin>
            <SectionAdmin titre={`Argent du ${formatDateFr(datePoint)}`}>
              {paiementsDuJour.length === 0 ? (
                <Vide texte="Aucune transaction pour cette journée." />
              ) : (
                [...paiementsDuJour].reverse().map((p) => <LignePaiement key={p.id} paiement={p} profil={profilParId(p.proprietaire)} onStatut={changerStatut} />)
              )}
            </SectionAdmin>
          </div>
        </div>
      )}

      {onglet === "inscrits" && (
        <SectionAdmin titre="Clients inscrits et visiteurs identifiés">
          {profils.length === 0 ? (
            <Vide texte="Aucun inscrit pour le moment. Créez un client depuis la partie client." />
          ) : (
            profils.map((p) => (
              <div key={identifiantProfil(p)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold">{p.prenom || "Sans prénom"} {p.nom}</div>
                  <div className="text-sm text-zinc-400">{p.type === "membre" ? "Membre" : "Visiteur"} · {p.code || identifiantProfil(p)}</div>
                  <div className="text-sm text-zinc-500">{p.email || "Email non renseigné"} · {p.tel || "Téléphone non renseigné"}</div>
                  {p.abonnement && <div className="text-sm text-amber-400 mt-1">Ancien abonnement : {p.abonnement.nom}</div>}
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
        <SectionAdmin titre="Toutes les séances programmées">
          {seancesTriees.length === 0 ? <Vide texte="Aucune séance programmée." /> : seancesTriees.map((r) => <LigneSeance key={r.id} reservation={r} profil={profilParId(r.proprietaire)} onAnnuler={() => annulerSeance(r.id)} />)}
        </SectionAdmin>
      )}

      {onglet === "transactions" && (
        <SectionAdmin titre="Gestion des transactions">
          {paiements.length === 0 ? <Vide texte="Aucune transaction enregistrée." /> : [...paiements].reverse().map((p) => <LignePaiement key={p.id} paiement={p} profil={profilParId(p.proprietaire)} onStatut={changerStatut} />)}
        </SectionAdmin>
      )}
    </div>
  );
}

function Stat({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-sm text-zinc-400">{titre}</div>
      <div className="text-2xl font-black text-amber-400 mt-1">{valeur}</div>
    </div>
  );
}

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
        <div className="text-sm text-zinc-400">{reservation.date} à {reservation.creneau} · {fmt(reservation.prix)}</div>
        <div className="text-sm text-zinc-500">{profil ? `${profil.prenom || ""} ${profil.nom || ""}`.trim() || reservation.proprietaire : reservation.proprietaire}</div>
      </div>
      <button onClick={onAnnuler} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
        <Trash2 size={14} /> Annuler
      </button>
    </div>
  );
}

function LignePaiement({ paiement, profil, onStatut }: { paiement: Paiement; profil?: Profil; onStatut: (id: string, statut: string) => void }) {
  const couleur = paiement.statut === "Payé" ? "text-green-400 bg-green-500/10" : paiement.statut === "Annulé" ? "text-red-400 bg-red-500/10" : "text-amber-400 bg-amber-400/10";

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{paiement.libelle}</div>
          <div className="text-sm text-zinc-500">{profil ? `${profil.prenom || ""} ${profil.nom || ""}`.trim() || paiement.proprietaire : paiement.proprietaire} · {paiement.date}</div>
        </div>
        <div className="text-right">
          <div className="font-bold">{fmt(paiement.montant)}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${couleur}`}>{paiement.statut}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => onStatut(paiement.id, "Payé")} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium">Payé</button>
        <button onClick={() => onStatut(paiement.id, "En attente")} className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 px-3 py-1.5 rounded-lg text-sm font-medium">En attente</button>
        <button onClick={() => onStatut(paiement.id, "Annulé")} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium">Annulé</button>
      </div>
    </div>
  );
}

function GenerateurQR() {
  const [url, setUrl] = useState("https://ma-salle-de-gym.com");
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=18181b&bgcolor=fbbf24`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
          <QrCode size={28} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Générateur de QR Code</h2>
        <p className="text-zinc-400">Saisissez l'adresse de votre application en ligne. Le QR code se génère automatiquement, imprimez-le et affichez-le dans votre salle !</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">URL de votre application</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="inline-block bg-amber-400 p-4 rounded-2xl">
          <img src={qrSrc} alt="QR Code" className="rounded-lg" width={300} height={300} />
        </div>
        <p className="text-zinc-400 text-sm mt-4 break-all">{url}</p>
        <a
          href={qrSrc}
          download="qrcode-elite-gym.png"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition mt-5">
          <Download size={18} /> Télécharger le QR Code
        </a>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mt-6 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-300 mb-2">Comment mettre votre application en ligne ?</p>
        <p className="mb-1">1. Hébergez cette application sur un service gratuit comme <span className="text-amber-400">Vercel</span> ou <span className="text-amber-400">Netlify</span>.</p>
        <p className="mb-1">2. Copiez l'adresse (URL) obtenue et collez-la ci-dessus.</p>
        <p>3. Téléchargez le QR code, imprimez-le et placez-le à l'entrée de votre salle.</p>
      </div>
    </div>
  );
}

function Champ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none"
      />
    </div>
  );
}

function BoutonRetour({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition">
      ? Retour à l'accueil
    </button>
  );
}
