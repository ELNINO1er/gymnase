import { useEffect, useState } from "react";
import { CheckCircle2, Copy, CreditCard, FileText, Phone, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { paymentsApi } from "../../services/api";

const WAVE_NUMBER = "+2250749157741";
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function MemberPayments() {
  const { user, subscription } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    paymentsApi.getUserPayments(user.id).then(({ data }) => {
      setPayments(data.data.payments || []);
      setSummary(data.data.summary || { total_paid: 0, total_pending: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  async function copyWaveNumber() {
    await navigator.clipboard.writeText(WAVE_NUMBER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes paiements</h1>
          <p className="text-sm text-zinc-500 mt-1">Depots Wave, validations admin et factures.</p>
        </div>
        <Link to="/membre/factures" className="inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-amber-400/60 rounded-lg px-4 py-2 text-sm font-bold transition">
          <FileText size={17} /> Factures
        </Link>
      </div>

      <div className="bg-zinc-900 border border-amber-400/40 rounded-2xl p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-300 font-bold">
              <Phone size={18} /> Depot Wave
            </div>
            <div className="text-2xl font-black mt-2">{WAVE_NUMBER}</div>
            <div className="text-sm text-zinc-400 mt-2">
              Apres le depot, envoyez la reference du transfert a l'administration. L'abonnement et la facture sont actives apres validation.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={copyWaveNumber} className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg transition">
              {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />} {copied ? "Copie" : "Copier"}
            </button>
            <Link to="/membre/messages" className="inline-flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-700 hover:border-amber-400/60 font-bold px-4 py-2 rounded-lg transition">
              <Send size={17} /> Envoyer la preuve
            </Link>
          </div>
        </div>
        {!subscription && (
          <div className="mt-4 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-sm text-amber-100">
            Aucun abonnement actif pour le moment. Un admin doit creer ou activer votre souscription apres reception du depot.
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Total paye</div>
          <div className="text-2xl font-black text-green-400 mt-1">{fmt(summary.total_paid)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400">En attente</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{fmt(summary.total_pending)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Statut abonnement</div>
          <div className={`text-lg font-black mt-1 ${subscription ? "text-green-400" : "text-red-400"}`}>
            {subscription ? "Actif" : "A activer"}
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <CreditCard className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun paiement enregistre.</p>
          <p className="text-sm text-zinc-500 mt-1">Le premier paiement apparaitra apres creation par l'administration.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{payment.plan_name || "Paiement"}</div>
                <div className="text-sm text-zinc-500">
                  {new Date(payment.created_at).toLocaleDateString("fr-FR")} · {payment.payment_method}
                </div>
                {payment.transaction_reference && (
                  <div className="text-xs text-zinc-600 font-mono mt-0.5">{payment.transaction_reference}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold">{fmt(Number(payment.amount))}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  payment.status === "PAID" ? "bg-green-500/10 text-green-400"
                  : payment.status === "CANCELLED" || payment.status === "REFUNDED" ? "bg-red-500/10 text-red-400"
                  : "bg-amber-400/10 text-amber-400"
                }`}>
                  {payment.status === "PAID" ? "Paye" : payment.status === "PENDING" ? "En attente" : payment.status === "REFUNDED" ? "Rembourse" : "Annule"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
