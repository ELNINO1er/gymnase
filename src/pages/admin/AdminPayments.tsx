import { useEffect, useState } from "react";
import { paymentsApi, usersApi } from "../../services/api";
import { Check, Plus, RotateCcw, X } from "lucide-react";
import { useConfirm, Select } from "../../components/ui";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

const STATUS_OPTIONS = [
  { value: "", label: "Tous statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Paye" },
  { value: "CANCELLED", label: "Annule" },
  { value: "REFUNDED", label: "Rembourse" },
];

const METHOD_OPTIONS = [
  { value: "", label: "Toutes methodes" },
  { value: "CASH", label: "Cash" },
  { value: "WAVE", label: "Wave" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "MTN_MONEY", label: "MTN Money" },
  { value: "CARD", label: "Carte" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
];

const CREATE_METHOD_OPTIONS = METHOD_OPTIONS.filter((option) => option.value);

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ status: "", method: "", date_from: "", date_to: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ user_id: "", amount: "", payment_method: "WAVE", transaction_reference: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { confirm, dialog } = useConfirm();

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const [paymentsRes, membersRes] = await Promise.all([
        paymentsApi.getAll({ page, ...filters }),
        usersApi.getAll({ page: 1, limit: 200, role: "MEMBER", status: "ACTIVE" }),
      ]);
      setPayments(paymentsRes.data.data);
      setPagination(paymentsRes.data.pagination);
      setMembers(membersRes.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const memberOptions = members.map((member) => ({
    value: String(member.id),
    label: `${member.full_name}${member.member_code ? ` - ${member.member_code}` : ""}`,
  }));

  const handleCreatePayment = async () => {
    const amount = Number(createForm.amount);
    if (!createForm.user_id || !amount || amount <= 0) {
      setMessage({ type: "error", text: "Selectionnez un membre et saisissez un montant valide" });
      return;
    }

    try {
      await paymentsApi.create({
        user_id: Number(createForm.user_id),
        amount,
        payment_method: createForm.payment_method,
        transaction_reference: createForm.transaction_reference || undefined,
      });
      setMessage({ type: "success", text: "Paiement enregistre. Validez-le apres verification du depot." });
      setCreateForm({ user_id: "", amount: "", payment_method: "WAVE", transaction_reference: "" });
      setShowCreate(false);
      loadData(1);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.response?.data?.error || "Erreur" });
    }
  };

  const handleAction = (action: string, id: number, userName: string, amount: string) => {
    const configs: Record<string, { title: string; msg: string; variant: "success" | "warning" | "danger"; label: string }> = {
      validate: { title: "Valider le paiement", msg: `Confirmer le paiement de ${fmt(Number(amount))} pour ${userName} ?`, variant: "success", label: "Valider" },
      cancel: { title: "Annuler le paiement", msg: `Annuler le paiement de ${fmt(Number(amount))} pour ${userName} ?`, variant: "danger", label: "Annuler" },
      refund: { title: "Rembourser le paiement", msg: `Rembourser ${fmt(Number(amount))} a ${userName} ?`, variant: "warning", label: "Rembourser" },
    };

    const c = configs[action];
    if (!c) return;

    confirm(c.msg, async () => {
      try {
        if (action === "validate") await paymentsApi.validate(id);
        else if (action === "cancel") await paymentsApi.cancel(id);
        else if (action === "refund") await paymentsApi.refund(id);
        setMessage({ type: "success", text: "Action effectuee" });
        loadData(pagination.page);
      } catch (err: any) {
        setMessage({ type: "error", text: err.response?.data?.error || "Erreur" });
      }
    }, { title: c.title, variant: c.variant, confirmLabel: c.label });
  };

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des paiements</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <Plus size={16} /> Paiement manuel
        </button>
      </div>

      {message.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">Enregistrer un depot</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Membre *</label>
              <Select
                value={createForm.user_id}
                onChange={(value) => setCreateForm({ ...createForm, user_id: value })}
                options={memberOptions}
                placeholder={memberOptions.length ? "Choisir un membre" : "Aucun membre actif"}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Montant *</label>
              <input
                type="number"
                min="1"
                value={createForm.amount}
                onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                placeholder="Ex: 15000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Methode</label>
              <Select
                value={createForm.payment_method}
                onChange={(value) => setCreateForm({ ...createForm, payment_method: value })}
                options={CREATE_METHOD_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Reference transaction</label>
              <input
                value={createForm.transaction_reference}
                onChange={(e) => setCreateForm({ ...createForm, transaction_reference: e.target.value })}
                placeholder="Reference Wave, cash, virement..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="text-xs text-zinc-500 mt-3">
            Le paiement sera cree en attente. Utilisez ensuite le bouton de validation apres controle du depot.
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreatePayment} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">Enregistrer</button>
            <button onClick={() => setShowCreate(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={STATUS_OPTIONS} placeholder="Tous statuts" />
        <Select value={filters.method} onChange={(v) => setFilters({ ...filters, method: v })} options={METHOD_OPTIONS} placeholder="Toutes methodes" />
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100" style={{ colorScheme: "dark" }} />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100" style={{ colorScheme: "dark" }} />
        <button onClick={() => loadData(1)} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          Filtrer
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-zinc-400">Chargement...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Aucun paiement</div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-bold">{p.user_name}</div>
                <div className="text-sm text-zinc-400">
                  {p.plan_name || "Paiement"} &middot; {p.payment_method}
                </div>
                <div className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right mr-2">
                  <div className="font-bold">{fmt(Number(p.amount))}</div>
                  <PaymentStatus status={p.status} />
                </div>
                {p.status === "PENDING" && (
                  <>
                    <button onClick={() => handleAction("validate", p.id, p.user_name, p.amount)} title="Valider"
                      className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400"><Check size={16} /></button>
                    <button onClick={() => handleAction("cancel", p.id, p.user_name, p.amount)} title="Annuler"
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><X size={16} /></button>
                  </>
                )}
                {p.status === "PAID" && (
                  <button onClick={() => handleAction("refund", p.id, p.user_name, p.amount)} title="Rembourser"
                    className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"><RotateCcw size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i} onClick={() => loadData(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === i + 1 ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PAID: { label: "Paye", color: "bg-green-500/10 text-green-400" },
    PENDING: { label: "En attente", color: "bg-amber-400/10 text-amber-400" },
    CANCELLED: { label: "Annule", color: "bg-red-500/10 text-red-400" },
    REFUNDED: { label: "Rembourse", color: "bg-orange-500/10 text-orange-400" },
    FAILED: { label: "Echoue", color: "bg-red-500/10 text-red-400" },
  };
  const s = map[status] || { label: status, color: "bg-zinc-800 text-zinc-400" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
}
