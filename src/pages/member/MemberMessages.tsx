import { useEffect, useState } from "react";
import { Inbox, Mail, MailOpen, Send } from "lucide-react";
import { messagesApi } from "../../services/api";

export function MemberMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data } = await messagesApi.getInbox();
      setMessages(data.data);
    } catch {}
    setLoading(false);
  };

  const markRead = async (id: number) => {
    try {
      await messagesApi.markRead(id);
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: 1 } : m));
    } catch {}
  };

  const sendReply = async () => {
    if (!replyTo || !replyContent.trim()) {
      setFeedback({ type: "error", text: "Saisissez votre reponse" });
      return;
    }

    setSending(true);
    try {
      await messagesApi.send({
        receiver_id: Number(replyTo.sender_id),
        title: `Re: ${replyTo.title || "Message"}`.slice(0, 150),
        content: replyContent.trim(),
        type: "PRIVATE",
      });
      setFeedback({ type: "success", text: "Reponse envoyee a l'administration" });
      setReplyTo(null);
      setReplyContent("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Impossible d'envoyer la reponse" });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  const unread = messages.filter((m) => !m.is_read).length;
  const typeFilters = ["ALL", "PRIVATE", "GROUP", "BROADCAST"];
  const filtered = filter === "ALL" ? messages : messages.filter((m) => m.type === filter);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        {unread > 0 && (
          <span className="text-sm bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full font-medium">
            {unread} non lu{unread > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {typeFilters.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${filter === t ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            {t === "ALL" ? "Tous" : t === "PRIVATE" ? "Prives" : t === "GROUP" ? "Groupe" : "General"}
          </button>
        ))}
      </div>

      {feedback.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {feedback.text}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Inbox className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun message pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              onClick={() => !msg.is_read && markRead(msg.id)}
              className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition ${msg.is_read ? "border-zinc-800 opacity-60" : "border-amber-400/30 hover:border-amber-400/50"}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {msg.is_read
                    ? <MailOpen size={18} className="text-zinc-600" />
                    : <Mail size={18} className="text-amber-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm truncate">{msg.title || "Message"}</div>
                    <span className="text-xs text-zinc-500 shrink-0">{new Date(msg.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">{msg.content}</div>
                  <div className="text-xs text-zinc-600 mt-2">
                    De : {msg.sender_name || "Administration"}
                    {msg.type !== "PRIVATE" && <span className="ml-2 bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{msg.type}</span>}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(event) => { event.stopPropagation(); setReplyTo(msg); setReplyContent(""); }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 px-3 py-1.5 text-xs font-bold transition">
                      <Send size={13} /> Repondre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {replyTo && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold">Repondre a {replyTo.sender_name || "l'administration"}</h2>
                <p className="text-xs text-zinc-500 mt-1">{replyTo.title || "Message"}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white">Fermer</button>
            </div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={5}
              placeholder="Votre reponse..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setReplyTo(null)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm">Annuler</button>
              <button disabled={sending} onClick={sendReply} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
