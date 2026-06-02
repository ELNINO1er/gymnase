import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Dumbbell, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const AUTO_RESET_SECONDS = 5;

export function CheckInPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_RESET_SECONDS);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    // Auto check-in
    api.post("/qrcode/self-checkin")
      .then(({ data }) => {
        setResult(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Erreur de verification");
        setResult({ access: "DENIED" });
        setLoading(false);
      });
  }, [isLoggedIn]);

  // Auto-reset countdown after result is shown
  useEffect(() => {
    if (loading || !result) return;

    setCountdown(AUTO_RESET_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/kiosk");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, result, navigate]);

  // Pas connecte -> rediriger vers login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-md w-full">
          <div className="flex justify-center mb-5">
            <span className="bg-amber-400 text-zinc-950 p-3 rounded-xl">
              <Dumbbell size={32} />
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Elite Gym — Check-in</h1>
          <p className="text-zinc-400 mb-6">Connectez-vous pour enregistrer votre entree</p>
          <Link
            to="/login"
            state={{ from: { pathname: "/checkin" } }}
            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-4 rounded-xl text-lg transition">
            <LogIn size={20} /> Se connecter
          </Link>
          <p className="text-zinc-500 text-xs mt-4">Apres connexion, votre entree sera enregistree automatiquement.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="text-amber-400 animate-pulse text-xl flex items-center gap-3">
          <Dumbbell className="animate-bounce" size={28} /> Verification en cours...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      {result?.access === "GRANTED" ? (
        <div className="bg-green-500/10 border-2 border-green-500 rounded-3xl p-10 text-center max-w-md w-full animate-in">
          <CheckCircle className="mx-auto text-green-400 mb-5" size={80} />
          <div className="text-3xl font-black text-green-400 mb-3">BIENVENUE</div>
          <div className="text-2xl font-bold mb-1">{result.member?.full_name}</div>
          <div className="text-zinc-400 font-mono text-sm mb-4">{result.member?.member_code}</div>

          {result.subscription && (
            <div className="bg-zinc-950/60 rounded-2xl p-4 mb-4">
              <div className="text-amber-400 font-bold text-lg">{result.subscription.plan_name}</div>
              <div className="text-zinc-300 text-sm">{result.subscription.days_left} jour(s) restant(s)</div>
            </div>
          )}

          <div className="text-green-400/80 text-lg mb-4">
            {result.checked_in ? "Entree enregistree !" : "Deja enregistre — Bon entrainement !"}
          </div>

          <div className="text-zinc-500 text-sm">Retour automatique dans {countdown}s</div>
        </div>
      ) : (
        <div className="bg-red-500/10 border-2 border-red-500 rounded-3xl p-10 text-center max-w-md w-full animate-in">
          <XCircle className="mx-auto text-red-400 mb-5" size={80} />
          <div className="text-3xl font-black text-red-400 mb-3">ACCES REFUSE</div>
          <div className="text-xl text-zinc-300 mb-4">{error || "Verification echouee"}</div>
          <div className="text-zinc-500 mb-4">Veuillez contacter l'accueil</div>

          <div className="text-zinc-500 text-sm">Retour automatique dans {countdown}s</div>
        </div>
      )}
    </div>
  );
}
