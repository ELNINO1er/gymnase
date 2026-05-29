import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { paymentsApi } from "../../services/api";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function MemberPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    paymentsApi.getUserPayments(user.id).then(({ data }) => {
      setPayments(data.data.payments);
      setSummary(data.data.summary);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes paiements</h1>

      {/* Resume */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400">Total paye</div>
          <div className="text-2xl font-black text-green-400 mt-1">{fmt(summary.total_paid)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400">En attente</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{fmt(summary.total_pending)}</div>
        </div>
      </div>

      {/* Liste */}
      {payments.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <CreditCard className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun paiement enregistre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.plan_name || "Paiement"}</div>
                <div className="text-sm text-zinc-500">
                  {new Date(p.created_at).toLocaleDateString("fr-FR")} &middot; {p.payment_method}
                </div>
                {p.transaction_reference && (
                  <div className="text-xs text-zinc-600 font-mono mt-0.5">{p.transaction_reference}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">{fmt(Number(p.amount))}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === "PAID" ? "bg-green-500/10 text-green-400"
                  : p.status === "CANCELLED" || p.status === "REFUNDED" ? "bg-red-500/10 text-red-400"
                  : "bg-amber-400/10 text-amber-400"
                }`}>{p.status === "PAID" ? "Paye" : p.status === "PENDING" ? "En attente" : p.status === "REFUNDED" ? "Rembourse" : "Annule"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
