import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { platformApi } from "../../services/api";

interface LogEntry {
  id: number;
  admin_id: number;
  admin_name: string | null;
  gym_name: string | null;
  action: string;
  target_type: string;
  target_id: number | null;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export function PlatformLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const { data } = await platformApi.logs({ page });
      setLogs(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-amber-300 font-semibold">Audit</p>
        <h1 className="text-3xl font-black tracking-tight">Journal global</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-zinc-400 animate-pulse">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-zinc-400">Aucune activite.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-bold text-amber-300">{log.action}</span>
                      <span className="text-zinc-400">{log.target_type}</span>
                      {log.gym_name && <span className="text-zinc-500">· {log.gym_name}</span>}
                    </div>
                    <div className="text-sm mt-1">{log.description}</div>
                    <div className="text-xs text-zinc-500 mt-1">Par {log.admin_name || "Systeme"} {log.ip_address ? `· ${log.ip_address}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 whitespace-nowrap">
                    <Clock size={12} />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-sm disabled:opacity-40">Precedent</button>
          <span className="text-sm text-zinc-400">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-sm disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  );
}
