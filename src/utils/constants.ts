import type { Tarifs, TypeSeance } from "../types";

export const TARIFS: { membre: Tarifs; visiteur: Tarifs } = {
  membre: {
    seance: 2000,
    inscription: 10000,
  },
  visiteur: {
    seance: 3000,
    inscription: 0,
  },
};

export const TYPES_SEANCE: TypeSeance[] = [
  { id: "muscu", nom: "Musculation", icone: "\u{1F4AA}" },
  { id: "cardio", nom: "Cardio / HIIT", icone: "\u{1F3C3}" },
  { id: "cours", nom: "Cours collectif", icone: "\u{1F9D8}" },
  { id: "coach", nom: "Coaching priv\u00e9", icone: "\u{1F3AF}" },
];

export const CRENEAUX = [
  "06:00", "07:30", "09:00", "10:30", "12:00",
  "14:00", "16:00", "17:30", "19:00", "20:30",
];

export const CODE_ADMIN = import.meta.env.VITE_CODE_ADMIN || "ADMIN2024";
export const CODE_DEMO = import.meta.env.VITE_CODE_DEMO || "ELITE2024";
export const WAVE_PAYMENT_LINK = import.meta.env.VITE_WAVE_PAYMENT_LINK || "https://pay.wave.com/m/elite-gym-demo";
