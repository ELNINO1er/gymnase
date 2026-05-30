import { useEffect, useState } from "react";
import { invoicesApi } from "../../services/api";
import { FileText, Download } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = (page = 1) => {
    invoicesApi.getAll({ page }).then(({ data }) => { setInvoices(data.data); setPagination(data.pagination); setLoading(false); }).catch(() => setLoading(false));
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Factures</h1>

      {invoices.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <FileText className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucune facture generee</p>
          <p className="text-zinc-500 text-xs mt-1">Les factures sont generees automatiquement quand un paiement est valide.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold font-mono text-amber-400">{inv.invoice_number}</div>
                <div className="text-sm text-zinc-400">{inv.label} &middot; {inv.full_name}</div>
                <div className="text-xs text-zinc-500">{new Date(inv.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-bold">{fmt(Number(inv.amount))}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "PAID" ? "bg-green-500/10 text-green-400" : "bg-amber-400/10 text-amber-400"}`}>{inv.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i + 1)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === i + 1 ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
