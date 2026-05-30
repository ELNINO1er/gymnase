import { Dumbbell, Home, QrCode, ShieldCheck } from "lucide-react";
import { useAppData } from "./hooks/useAppData";
import { NavBtn } from "./components/ui";
import { Accueil, EspaceConnexionClient, EspaceInscription, EspaceMembre, EspaceVisiteur, GenerateurQR } from "./components/client";
import { EspaceAdmin } from "./components/admin";

export default function App() {
  const {
    vue, setVue,
    espace, setEspace,
    chargement,
    reservations, sauverReservations,
    profil, sauverProfil,
    profils, sauverProfils,
    paiements, sauverPaiements,
  } = useAppData();

  if (chargement) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse flex items-center gap-2">
          <Dumbbell className="animate-bounce" /> Chargement...
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
        Elite Gym &middot; Salle de gym &middot; D&eacute;monstration interactive
      </footer>
    </div>
  );
}
