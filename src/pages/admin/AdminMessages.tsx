import { useEffect, useState } from "react";
import { messagesApi } from "../../services/api";
import { Send, Mail } from "lucide-react";
import { Select } from "../../components/ui";

const TYPE_OPTIONS = [{ value: "PRIVATE", label: "Prive (1 membre)" }, { value: "GROUP", label: "Groupe" }, { value: "BROADCAST", label: "Tous" }];
const GROUP_OPTIONS = [{ value: "MEMBERS", label: "Membres actifs" }, { value: "EXPIRED", label: "Abonnements expires" }, { value: "INACTIVE", label: "Inactifs (+30j)" }, { value: "COACHES", label: "Coachs" }];

export function AdminMessages() {
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ receiver_id: "", title: "", content: "", type: "BROADCAST", target_group: "MEMBERS" });
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => { load(); }, []);
  const load = () => { messagesApi.getSent().then(({ data }) => { setSent(data.data); setLoading(false); }).catch(() => setLoading(false)); };

  const handleSend = async () => {
    if (!form.title || !form.content) { setMsg({ type: "error", text: "Titre et contenu requis" }); return; }
    if (form.type === "PRIVATE" && !form.receiver_id) { setMsg({ type: "error", text: "ID membre requis" }); return; }

    try {
      const payload: any = { title: form.title, content: form.content, type: form.type };
      if (form.type === "PRIVATE") payload.receiver_id = Number(form.receiver_id);
      if (form.type === "GROUP") payload.target_group = form.target_group;

      const { data } = await messagesApi.send(payload);
      setMsg({ type: "success", text: data.message });
      setForm({ ...form, title: "", content: "", receiver_id: "" });
      load();
    } catch (err: any) { setMsg({ type: "error", text: err.response?.data?.message || "Erreur" }); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Messagerie</h1>
      {msg.text && <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</div>}

      {/* Formulaire */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Send size={18} className="text-amber-400" /> Envoyer un message</h3>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div><label className="block text-xs text-zinc-400 mb-1">Type d'envoi</label>
            <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPE_OPTIONS} /></div>
          {form.type === "PRIVATE" && (
            <div><label className="block text-xs text-zinc-400 mb-1">ID du membre</label>
              <input value={form.receiver_id} onChange={(e) => setForm({ ...form, receiver_id: e.target.value })} placeholder="ID"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" /></div>
          )}
          {form.type === "GROUP" && (
            <div><label className="block text-xs text-zinc-400 mb-1">Groupe cible</label>
              <Select value={form.target_group} onChange={(v) => setForm({ ...form, target_group: v })} options={GROUP_OPTIONS} /></div>
          )}
        </div>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre du message"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-3 focus:border-amber-400 focus:outline-none" />
        <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Contenu du message..." rows={3}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-3 focus:border-amber-400 focus:outline-none resize-none" />
        <button onClick={handleSend} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">Envoyer</button>
      </div>

      {/* Messages envoyes */}
      <h3 className="font-bold mb-3">Messages envoyes ({sent.length})</h3>
      {loading ? <p className="text-zinc-400">Chargement...</p> : sent.length === 0 ? <p className="text-zinc-500 text-sm">Aucun message envoye</p> : (
        <div className="space-y-2">
          {sent.slice(0, 20).map((m) => (
            <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{m.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{m.content?.slice(0, 80)}{m.content?.length > 80 ? "..." : ""}</div>
                <div className="text-xs text-zinc-600 mt-1">{m.type} {m.receiver_name && `→ ${m.receiver_name}`} &middot; {new Date(m.created_at).toLocaleString("fr-FR")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
