import { useState } from "react";

export function useConfirm() {
  const [state, setState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const confirm = (message: string, onConfirm: () => void) => {
    setState({ message, onConfirm });
  };

  const dialog = state ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
        <p className="text-zinc-100 font-medium mb-5">{state.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setState(null)}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition">
            Annuler
          </button>
          <button
            onClick={() => { state.onConfirm(); setState(null); }}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold transition">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
