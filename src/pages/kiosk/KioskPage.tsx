import { useEffect, useState } from "react";
import { Dumbbell, QrCode, Shield, Users } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const FRONTEND_URL = window.location.origin;
const CHECKIN_URL = `${FRONTEND_URL}/checkin`;

const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(CHECKIN_URL)}&color=18181b&bgcolor=fbbf24&margin=10`;

export function KioskPage() {
  const [time, setTime] = useState(new Date());
  const [inGymCount, setInGymCount] = useState(0);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  // Horloge
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh presences toutes les 10 secondes
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const { data } = await axios.get(`${API_URL}/attendance/in-gym`, { headers: { Authorization: `Bearer ${token}` } });
          setInGymCount(data.data?.count || 0);
          const { data: todayData } = await axios.get(`${API_URL}/attendance/today`, { headers: { Authorization: `Bearer ${token}` } });
          setRecentEntries((todayData.data?.logs || []).filter((l: any) => l.status === "VALID").slice(0, 5));
        }
      } catch {}
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-amber-400 text-zinc-950 p-2.5 rounded-xl">
            <Dumbbell size={28} />
          </span>
          <div>
            <div className="text-2xl font-black tracking-tight">ELITE GYM</div>
            <div className="text-xs text-zinc-400">Borne d'accueil</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-amber-400 font-mono">
            {time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div className="text-xs text-zinc-500">
            {time.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 max-w-5xl w-full">
          {/* QR Code */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center flex-shrink-0">
            <div className="inline-flex bg-amber-400/10 p-3 rounded-full mb-4">
              <QrCode size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Scannez pour entrer</h2>
            <p className="text-zinc-400 text-sm mb-6">Ouvrez la camera de votre telephone et scannez ce QR code</p>

            <div className="inline-block bg-amber-400 p-4 rounded-2xl mb-4">
              <img src={qrImageUrl} alt="QR Code check-in" className="rounded-lg" width={300} height={300} />
            </div>

            <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs mt-2">
              <Shield size={12} />
              <span>Verification automatique du compte</span>
            </div>
          </div>

          {/* Infos */}
          <div className="flex-1 w-full max-w-sm">
            {/* En salle */}
            <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-6 mb-5 text-center">
              <Users className="mx-auto text-green-400 mb-2" size={32} />
              <div className="text-4xl font-black text-green-400">{inGymCount}</div>
              <div className="text-sm text-zinc-400 mt-1">personne(s) en salle</div>
            </div>

            {/* Instructions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
              <h3 className="font-bold mb-3">Comment entrer</h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex items-start gap-3">
                  <span className="bg-amber-400 text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Ouvrez la camera de votre telephone</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-amber-400 text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Scannez le QR code affiche sur cet ecran</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-amber-400 text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Connectez-vous si ce n'est pas deja fait</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-amber-400 text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span>Votre entree est enregistree automatiquement</span>
                </div>
              </div>
            </div>

            {/* Derniers check-ins */}
            {recentEntries.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="font-bold mb-3 text-sm">Dernieres entrees</h3>
                <div className="space-y-2">
                  {recentEntries.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{entry.full_name}</span>
                      <span className="text-xs text-zinc-500">
                        {new Date(entry.check_in_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
