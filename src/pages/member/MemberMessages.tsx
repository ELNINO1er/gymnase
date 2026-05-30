import { useEffect, useState } from "react";
import { Mail, MailOpen, Inbox } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { messagesApi } from "../../services/api";

export function MemberMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        {unread > 0 && (
          <span className="text-sm bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full font-medium">
            {unread} non lu{unread > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <Inbox className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun message pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
