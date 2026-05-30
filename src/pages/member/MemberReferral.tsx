import { useEffect, useState } from "react";
import { Gift, Copy, Check, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { referralsApi } from "../../services/api";

export function MemberReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({ total: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    referralsApi.getMyCode().then(({ data }) => {
      setReferralCode(data.data.referral_code);
      setStats({ total: data.data.total_referrals || 0, approved: data.data.approved || 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Parrainage</h1>

      {/* Code de parrainage */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center mb-6">
        <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-full mb-4">
          <Gift size={32} />
        </div>
        <h2 className="font-bold text-lg mb-1">Invitez vos amis</h2>
        <p className="text-zinc-400 text-sm mb-5">Partagez votre code et gagnez des recompenses quand vos amis s'inscrivent !</p>

        <div className="bg-zinc-950 rounded-xl p-4 mb-4">
          <div className="text-xs text-zinc-500 mb-1">Votre code de parrainage</div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-wider">{referralCode}</div>
        </div>

        <button onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-xl transition">
          {copied ? <><Check size={18} /> Copie !</> : <><Copy size={18} /> Copier le code</>}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-amber-400" /> Mes parrainages</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400">{stats.total}</div>
            <div className="text-xs text-zinc-400 mt-1">Filleul(s) total</div>
          </div>
          <div className="bg-zinc-950 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{stats.approved}</div>
            <div className="text-xs text-zinc-400 mt-1">Approuve(s)</div>
          </div>
        </div>
      </div>

      {/* Explication */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mt-6 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-300 mb-2">Comment ca marche ?</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Partagez votre code avec un ami</li>
          <li>Votre ami s'inscrit et entre votre code</li>
          <li>L'administration valide le parrainage</li>
          <li>Vous recevez votre recompense</li>
        </ol>
      </div>
    </div>
  );
}
