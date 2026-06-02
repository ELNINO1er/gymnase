import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { invoicesApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface Invoice {
  id: number;
  invoice_number: string;
  label: string;
  amount: number;
  status: string;
  created_at: string;
}

export function MemberInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await invoicesApi.getUserInvoices(user.id);
        setInvoices(data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function viewPdf(id: number) {
    try {
      const { data } = await invoicesApi.getPdf(id);
      const d = data.data;
      const inv = d.invoice || d;
      const member = d.member || {};
      const gym = d.gym || {};
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`
        <html><head><title>Facture ${inv.number || inv.invoice_number}</title>
        <style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;color:#333}
        h1{font-size:24px;margin:0}h2{font-size:16px;color:#666;margin:4px 0 20px}
        table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:8px;text-align:left;border-bottom:1px solid #eee}
        .total{font-size:20px;font-weight:bold;text-align:right;margin-top:20px}
        .footer{margin-top:40px;color:#999;font-size:12px;text-align:center}
        @media print{body{margin:0}}</style></head><body>
        <h1>FACTURE</h1>
        <h2>${inv.number || inv.invoice_number || ""}</h2>
        <p><strong>Salle :</strong> ${gym.name || "Elite Gym"}</p>
        ${gym.address ? `<p>${gym.address}</p>` : ""}
        ${gym.phone ? `<p>Tel : ${gym.phone}</p>` : ""}
        <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
        <p><strong>Membre :</strong> ${member.full_name || "-"}</p>
        <p><strong>Email :</strong> ${member.email || "-"}</p>
        <p><strong>Tel :</strong> ${member.phone || "-"}</p>
        <p><strong>Code :</strong> ${member.member_code || "-"}</p>
        <p><strong>Date :</strong> ${inv.date ? new Date(inv.date).toLocaleDateString("fr-FR") : "-"}</p>
        <table><tr><th>Description</th><th>Montant</th></tr>
        <tr><td>${inv.label || "Paiement"}</td><td>${Number(inv.amount || 0).toLocaleString()} ${gym.currency || "FCFA"}</td></tr></table>
        <div class="total">Total : ${Number(inv.amount || 0).toLocaleString()} ${gym.currency || "FCFA"}</div>
        <p>Methode : ${inv.payment_method || "-"}</p>
        <p>Statut : ${inv.status || "-"}</p>
        ${inv.transaction_reference ? `<p>Ref : ${inv.transaction_reference}</p>` : ""}
        <div class="footer">Merci de votre confiance.</div>
        </body></html>
      `);
      w.document.close();
      w.print();
    } catch {
      alert("Erreur lors du chargement de la facture");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Mon espace</p>
        <h1 className="text-3xl font-black tracking-tight">Mes factures</h1>
      </div>

      {loading ? (
        <div className="text-zinc-400 animate-pulse">Chargement...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-400">
          <FileText size={40} className="mx-auto mb-3 text-zinc-600" />
          <p>Aucune facture disponible.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold">{inv.invoice_number}</div>
                  <div className="text-sm text-zinc-400">{inv.label}</div>
                  <div className="text-xs text-zinc-500">{new Date(inv.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-amber-400">{Number(inv.amount).toLocaleString()} FCFA</div>
                    <span className={`text-xs font-bold ${inv.status === "PAID" ? "text-emerald-400" : "text-zinc-400"}`}>{inv.status}</span>
                  </div>
                  <button onClick={() => viewPdf(inv.id)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition" title="Voir/Imprimer">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
