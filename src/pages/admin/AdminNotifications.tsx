import { useEffect, useState } from "react";
import { notificationsApi } from "../../services/api";
import { Bell, Check, Send, Trash2 } from "lucide-react";

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ title: "", message: "", type: "INFO", broadcast: true });
  const [msg, setMsg] = useState({ type: "", text: "" });

  const loadNotifications = () => {
    notificationsApi.getAll().then(({ data }) => {
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unread_count);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadNotifications(); }, []);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    loadNotifications();
  };

  const deleteNotif = async (id: number) => {
    await notificationsApi.delete(id);
    loadNotifications();
  };

  const handleSend = async () => {
    if (!sendForm.title || !sendForm.message) {
      setMsg({ type: "error", text: "Titre et message requis" });
      return;
    }
    try {
      const { data } = await notificationsApi.send({
        title: sendForm.title,
        message: sendForm.message,
        type: sendForm.type,
        broadcast: sendForm.broadcast,
      });
      setMsg({ type: "success", text: data.data.message });
      setSendForm({ title: "", message: "", type: "INFO", broadcast: true });
      setShowSend(false);
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.error || "Erreur" });
    }
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <div className="text-sm text-amber-400">{unreadCount} non lue(s)</div>}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg text-sm">
              <Check size={14} /> Tout lire
            </button>
          )}
          <button onClick={() => setShowSend(!showSend)} className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-3 py-2 rounded-lg text-sm">
            <Send size={14} /> Envoyer
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      {/* Formulaire envoi */}
      {showSend && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-4">Envoyer une notification</h3>
          <div className="space-y-3">
            <input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
              placeholder="Titre" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none" />
            <textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
              placeholder="Message..." rows={3} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 focus:border-amber-400 focus:outline-none resize-none" />
            <div className="flex gap-3">
              <select value={sendForm.type} onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                <option value="INFO">Info</option>
                <option value="SYSTEM">Systeme</option>
                <option value="SUBSCRIPTION">Abonnement</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={sendForm.broadcast} onChange={(e) => setSendForm({ ...sendForm, broadcast: e.target.checked })}
                  className="rounded" />
                Envoyer a tous les membres
              </label>
            </div>
            <button onClick={handleSend} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Liste notifications */}
      {notifications.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          <Bell className="mx-auto mb-3 text-zinc-600" size={40} />
          Aucune notification
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-start justify-between gap-3 ${n.is_read ? "border-zinc-800 opacity-60" : "border-amber-400/30"}`}>
              <div>
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{n.message}</div>
                <div className="text-xs text-zinc-600 mt-1">{new Date(n.created_at).toLocaleString("fr-FR")} &middot; {n.type}</div>
              </div>
              <button onClick={() => deleteNotif(n.id)} className="text-zinc-600 hover:text-red-400 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
