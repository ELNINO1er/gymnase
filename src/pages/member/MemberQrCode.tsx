import { useEffect, useState } from "react";
import { QrCode, RefreshCw, Download, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { qrcodeApi } from "../../services/api";

export function MemberQrCode() {
  const { user, subscription } = useAuth();
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  useEffect(() => {
    loadQrCode();
  }, []);

  const loadQrCode = async () => {
    try {
      const { data } = await qrcodeApi.getMy();
      setQrToken(data.data.qr_token);
    } catch {}
    setLoading(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { data } = await qrcodeApi.regenerate();
      setQrToken(data.data.qr_token);
    } catch {}
    setRegenerating(false);
  };

  // Generer l'URL de l'image QR code via API publique
  const qrImageUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrToken)}&color=18181b&bgcolor=fbbf24&margin=10`
    : "";

  if (loading) {
    return <div className="text-center py-20 text-zinc-400">Chargement du QR code...</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Mon QR Code</h1>

      {/* QR Code Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center mb-6">
        {/* Statut abonnement */}
        {subscription ? (
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <Shield size={14} />
            Abonnement actif &middot; {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <AlertTriangle size={14} />
            Aucun abonnement actif
          </div>
        )}

        {/* QR Code Image */}
        <div className="inline-block bg-amber-400 p-4 rounded-2xl mb-4">
          <img
            src={qrImageUrl}
            alt="QR Code membre"
            className="rounded-lg"
            width={280}
            height={280}
          />
        </div>

        {/* Infos membre */}
        <div className="mb-4">
          <div className="text-xl font-bold">{user?.full_name}</div>
          <div className="text-amber-400 font-mono text-sm mt-1">{user?.member_code}</div>
        </div>

        {/* Token (petit, discret) */}
        <div className="bg-zinc-950 rounded-xl p-3 mb-5">
          <div className="text-xs text-zinc-500 mb-1">Code QR</div>
          <div className="text-xs font-mono text-zinc-400 break-all select-all">{qrToken}</div>
        </div>

        {/* Instructions */}
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400 text-left mb-5">
          <p className="font-semibold text-zinc-300 mb-2">Comment utiliser votre QR code</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ouvrez cette page sur votre telephone</li>
            <li>Presentez le QR code a l'accueil de la salle</li>
            <li>Le systeme verifie automatiquement votre abonnement</li>
            <li>Votre presence est enregistree</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl text-sm font-medium transition">
            <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
            {regenerating ? "..." : "Regenerer"}
          </button>
          <a
            href={qrImageUrl}
            download={`qr-${user?.member_code}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-bold transition">
            <Download size={14} />
            Telecharger
          </a>
        </div>
      </div>

      {/* Abonnement detail */}
      {subscription && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold mb-3">Abonnement</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Plan</span>
              <span className="font-bold text-amber-400">{subscription.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Expiration</span>
              <span>{new Date(subscription.end_date).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Statut</span>
              <span className="text-green-400 font-medium">{subscription.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
