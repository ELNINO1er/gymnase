import { useEffect, useState } from "react";
import { messagesApi, usersApi } from "../../services/api";
import { Inbox, MailOpen, Send } from "lucide-react";
import { Select } from "../../components/ui";

const TYPE_OPTIONS = [{ value: "PRIVATE", label: "Prive (1 membre)" }, { value: "GROUP", label: "Groupe" }, { value: "BROADCAST", label: "Tous" }];
const GROUP_OPTIONS = [{ value: "MEMBERS", label: "Membres actifs" }, { value: "EXPIRED", label: "Abonnements expires" }, { value: "INACTIVE", label: "Inactifs (+30j)" }, { value: "COACHES", label: "Coachs" }];

export function AdminMessages() {
  const [sent, setSent] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ receiver_id: "", title: "", content: "", type: "BROADCAST", target_group: "MEMBERS" });
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [sentRes, membersRes] = await Promise.all([
        messagesApi.getSent(),
        usersApi.getAll({ page: 1, limit: 200, status: "ACTIVE" }),
      ]);
      setSent(sentRes.data.data || []);
      setMembers(membersRes.data.data || []);
      const inboxRes = await messagesApi.getInbox();
      setInbox(inboxRes.data.data || []);
    } catch {
      // Les erreurs d'envoi sont affichees dans handleSend.
    } finally {
      setLoading(false);
    }
  };

  const memberOptions = members.map((member) => ({
    value: String(member.id),
    label: `${member.full_name}${member.member_code ? ` - ${member.member_code}` : ""}${member.role ? ` (${member.role})` : ""}`,
  }));

  const handleSend = async () => {
    if (!form.title || !form.content) { setMsg({ type: "error", text: "Titre et contenu requis" }); return; }
    if (form.type === "PRIVATE" && !form.receiver_id) { setMsg({ type: "error", text: "Selectionnez un destinataire" }); return; }

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

  const markRead = async (id: number) => {
    try {
      await messagesApi.markRead(id);
      setInbox((prev) => prev.map((message) => message.id === id ? { ...message, is_read: 1 } : message));
    } catch {}
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
            <div><label className="block text-xs text-zinc-400 mb-1">Destinataire</label>
              <Select
                value={form.receiver_id}
                onChange={(value) => setForm({ ...form, receiver_id: value })}
                options={memberOptions}
                placeholder={memberOptions.length ? "Choisir un destinataire" : "Aucun utilisateur actif"}
              /></div>
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

      <h3 className="font-bold mb-3 flex items-center gap-2"><Inbox size={18} className="text-amber-400" /> Reponses recues ({inbox.length})</h3>
      {loading ? <p className="text-zinc-400">Chargement...</p> : inbox.length === 0 ? <p className="text-zinc-500 text-sm mb-6">Aucune reponse recue</p> : (
        <div className="space-y-2 mb-6">
          {inbox.slice(0, 20).map((message) => (
            <button
              key={message.id}
              onClick={() => !message.is_read && markRead(message.id)}
              className={`w-full text-left bg-zinc-900 border rounded-xl p-3 transition ${message.is_read ? "border-zinc-800 opacity-70" : "border-amber-400/30 hover:border-amber-400/60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{message.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{message.content?.slice(0, 120)}{message.content?.length > 120 ? "..." : ""}</div>
                  <div className="text-xs text-zinc-600 mt-1">De : {message.sender_name || "Membre"} &middot; {new Date(message.created_at).toLocaleString("fr-FR")}</div>
                </div>
                <MailOpen size={16} className={message.is_read ? "text-zinc-600" : "text-amber-400"} />
              </div>
            </button>
          ))}
        </div>
      )}

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
