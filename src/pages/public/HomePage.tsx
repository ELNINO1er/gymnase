import { Link } from "react-router-dom";
import { ChevronRight, Dumbbell, Star, User, UserPlus } from "lucide-react";

export function HomePage() {
  return (
    <div>
      <section className="text-center py-12 sm:py-20">
        <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <Star size={14} /> Votre salle de gym nouvelle generation
        </div>
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-4 rounded-2xl border border-amber-400/40 bg-zinc-900 px-5 py-4 shadow-lg shadow-amber-400/10">
            <span className="bg-amber-400 text-zinc-950 p-3 rounded-xl">
              <Dumbbell size={34} />
            </span>
            <div className="text-left leading-none">
              <div className="text-4xl sm:text-6xl font-black tracking-tight">ELITE</div>
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-amber-400">GYM</div>
            </div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
          Reservez. Entrainez-vous.
          <span className="block text-amber-400">Depassez-vous.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
          Inscription, programmation de seances et paiement, le tout en quelques clics.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link
            to="/login"
            className="group bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl p-6 text-left transition">
            <User className="mb-3" size={28} />
            <div className="font-bold text-lg">Je suis membre</div>
            <div className="text-sm text-zinc-800 mb-3">Connectez-vous pour acceder a votre espace</div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              Se connecter <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/register"
            className="group bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl p-6 text-left transition">
            <UserPlus className="mb-3" size={28} />
            <div className="font-bold text-lg">M'inscrire</div>
            <div className="text-sm text-zinc-600 mb-3">Devenir membre et profiter de nos services</div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              Commencer <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
