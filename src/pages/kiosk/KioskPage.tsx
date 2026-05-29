import { useState } from "react";
import { Dumbbell, QrCode, CheckCircle, XCircle, Clock } from "lucide-react";
import api from "../../services/api";

export function KioskPage() {
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async () => {
    const token = qrInput.trim();
    if (!token) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      // Le kiosque doit etre authentifie en tant qu'admin
      const adminToken = localStorage.getItem("token");
      const { data } = await api.post("/qrcode/verify", { qr_token: token }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      setResult(data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || "QR code invalide";
      setError(msg);
      setResult({ access: "DENIED" });
    }

    setLoading(false);
    setQrInput("");

    // Reset apres 5 secondes
    setTimeout(() => {
      setResult(null);
      setError("");
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <span className="bg-amber-400 text-zinc-950 p-3 rounded-xl">
          <Dumbbell size={32} />
        </span>
        <div>
          <div className="text-3xl font-black tracking-tight">ELITE GYM</div>
          <div className="text-sm text-zinc-400">Borne d'accueil</div>
        </div>
      </div>

      {/* Resultat */}
      {result ? (
        result.access === "GRANTED" ? (
          <div className="bg-green-500/10 border-2 border-green-500 rounded-3xl p-10 text-center max-w-md w-full animate-in">
            <CheckCircle className="mx-auto text-green-400 mb-4" size={64} />
            <div className="text-3xl font-black text-green-400 mb-2">ACCES AUTORISE</div>
            <div className="text-xl font-bold mb-1">{result.member?.full_name}</div>
            <div className="text-zinc-400 text-sm">{result.member?.member_code}</div>
            {result.subscription && (
              <div className="mt-4 bg-zinc-950/50 rounded-xl p-3">
                <div className="text-sm text-zinc-400">{result.subscription.plan_name}</div>
                <div className="text-amber-400 font-bold">{result.subscription.days_left} jours restants</div>
              </div>
            )}
            {result.pending_payments > 0 && (
              <div className="mt-3 text-amber-400 text-sm">
                {result.pending_payments} paiement(s) en attente
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-500/10 border-2 border-red-500 rounded-3xl p-10 text-center max-w-md w-full animate-in">
            <XCircle className="mx-auto text-red-400 mb-4" size={64} />
            <div className="text-3xl font-black text-red-400 mb-2">ACCES REFUSE</div>
            <div className="text-zinc-400">{error || "Veuillez contacter l'accueil"}</div>
          </div>
        )
      ) : (
        <div className="max-w-md w-full text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 mb-6">
            <QrCode className="mx-auto text-amber-400 mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2">Scanner votre QR code</h2>
            <p className="text-zinc-400 text-sm mb-6">Presentez votre QR code ou entrez votre code membre</p>
            <input
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Code QR ou code membre..."
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-4 text-center text-lg font-mono focus:border-amber-400 focus:outline-none mb-4"
            />
            <button
              onClick={handleScan}
              disabled={loading || !qrInput.trim()}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 text-zinc-950 font-bold py-4 rounded-xl text-lg transition">
              {loading ? "Verification..." : "Valider l'entree"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-zinc-600 text-sm">
            <Clock size={14} />
            <span>{new Date().toLocaleString("fr-FR")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
