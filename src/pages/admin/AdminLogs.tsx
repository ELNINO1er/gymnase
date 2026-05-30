import { useEffect, useState } from "react";
import { logsApi } from "../../services/api";
import { FileText } from "lucide-react";

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = (page = 1) => {
    logsApi.getAll({ page }).then(({ data }) => { setLogs(data.data); setPagination(data.pagination); setLoading(false); }).catch(() => setLoading(false));
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Journal d'activite</h1>

      {logs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <FileText className="mx-auto text-zinc-600 mb-3" size={40} /><p className="text-zinc-400">Aucune activite enregistree</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">{log.action}</span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{log.target_type}</span>
                </div>
                <div className="text-sm mt-1">{log.description}</div>
                <div className="text-xs text-zinc-600 mt-1">{log.admin_name} &middot; {new Date(log.created_at).toLocaleString("fr-FR")} &middot; IP: {log.ip_address}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pagination.page === i + 1 ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
