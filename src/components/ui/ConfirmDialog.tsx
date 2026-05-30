import { useState, useEffect, type ReactNode } from "react";
import { AlertTriangle, CheckCircle, Info, Trash2, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type ConfirmVariant = "danger" | "warning" | "success" | "info";

interface ConfirmState {
  title: string;
  message: string;
  variant: ConfirmVariant;
  confirmLabel?: string;
  onConfirm: () => void;
}

// ── Hook useConfirm ────────────────────────────────────────────

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = (
    message: string,
    onConfirm: () => void,
    options?: { title?: string; variant?: ConfirmVariant; confirmLabel?: string }
  ) => {
    setState({
      title: options?.title || "Confirmation",
      message,
      variant: options?.variant || "danger",
      confirmLabel: options?.confirmLabel,
      onConfirm,
    });
  };

  const dialog = state ? (
    <Modal onClose={() => setState(null)}>
      <div className="text-center">
        <VariantIcon variant={state.variant} />
        <h3 className="text-lg font-bold mt-4 mb-2">{state.title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{state.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setState(null)}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition text-sm">
            Annuler
          </button>
          <button
            onClick={() => { state.onConfirm(); setState(null); }}
            className={`px-5 py-2.5 rounded-xl font-bold transition text-sm ${variantButtonColors[state.variant]}`}>
            {state.confirmLabel || variantLabels[state.variant]}
          </button>
        </div>
      </div>
    </Modal>
  ) : null;

  return { confirm, dialog };
}

// ── Composant Modal reutilisable ───────────────────────────────

export function Modal({ children, onClose, size = "sm" }: { children: ReactNode; onClose: () => void; size?: "sm" | "md" | "lg" }) {
  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const maxWidth = size === "lg" ? "max-w-2xl" : size === "md" ? "max-w-lg" : "max-w-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Content */}
      <div className={`relative ${maxWidth} w-full bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 shadow-2xl shadow-black/50 animate-in`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Helpers variant ────────────────────────────────────────────

const variantButtonColors: Record<ConfirmVariant, string> = {
  danger: "bg-red-500 hover:bg-red-400 text-white",
  warning: "bg-amber-500 hover:bg-amber-400 text-zinc-950",
  success: "bg-green-500 hover:bg-green-400 text-white",
  info: "bg-blue-500 hover:bg-blue-400 text-white",
};

const variantLabels: Record<ConfirmVariant, string> = {
  danger: "Supprimer",
  warning: "Confirmer",
  success: "Valider",
  info: "OK",
};

function VariantIcon({ variant }: { variant: ConfirmVariant }) {
  const wrapClass = "inline-flex p-3 rounded-full";
  switch (variant) {
    case "danger":
      return <div className={`${wrapClass} bg-red-500/10`}><Trash2 className="text-red-400" size={28} /></div>;
    case "warning":
      return <div className={`${wrapClass} bg-amber-400/10`}><AlertTriangle className="text-amber-400" size={28} /></div>;
    case "success":
      return <div className={`${wrapClass} bg-green-500/10`}><CheckCircle className="text-green-400" size={28} /></div>;
    case "info":
      return <div className={`${wrapClass} bg-blue-500/10`}><Info className="text-blue-400" size={28} /></div>;
  }
}
