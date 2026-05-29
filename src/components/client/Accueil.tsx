import { ChevronRight, Dumbbell, Star, User, UserPlus, Users } from "lucide-react";
import { TARIFS } from "../../utils/constants";
import { fmt } from "../../utils/helpers";

function CarteTarif({ titre, badge, surligne, seance, extra }: {
  titre: string;
  badge: string;
  surligne?: boolean;
  seance: number;
  extra: string;
}) {
  return (
    <div className={`rounded-2xl p-6 border ${surligne ? "border-amber-400 bg-amber-400/5" : "border-zinc-800 bg-zinc-900"}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{titre}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${surligne ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>{badge}</span>
      </div>
      <div className="mb-1">
        <span className="text-3xl font-black">{fmt(seance)}</span> <span className="text-zinc-400">/ s\u00e9ance</span>
      </div>
      <div className="text-sm text-zinc-400 mb-4">{extra}</div>
      <div className="rounded-2xl bg-zinc-950/60 p-4 mb-5 text-sm text-zinc-300">
        <div className="font-semibold text-zinc-100 mb-2">Co\u00fbt indicatif par semaine et par mois</div>
        {[1, 2, 3, 4, 5].map((count) => (
          <div key={count} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-2 border-b border-zinc-900 last:border-b-0">
            <span>{count} s\u00e9ance{count > 1 ? "s" : ""} / semaine</span>
            <span className="text-zinc-400">Hebdo</span>
            <span className="font-bold text-right">{fmt(seance * count)}</span>
            <span className="col-start-1 col-end-2 text-zinc-400">Mensuel</span>
            <span className="col-start-2 col-end-3 text-zinc-400">4 semaines</span>
            <span className="font-bold text-right">{fmt(seance * count * 4)}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-300">
        Paiement simple : chaque s\u00e9ance est r\u00e9serv\u00e9e et pay\u00e9e s\u00e9par\u00e9ment.
      </div>
    </div>
  );
}

export function Accueil({ setVue }: { setVue: (vue: string) => void }) {
  return (
    <div>
      <section className="text-center py-12 sm:py-20">
        <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <Star size={14} /> Votre salle de gym nouvelle g\u00e9n\u00e9ration
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
          R\u00e9servez. Entra\u00eenez-vous.
          <span className="block text-amber-400">D\u00e9passez-vous.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
          Inscription, programmation de s\u00e9ances et paiement \u00e0 la s\u00e9ance, le tout en quelques clics.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => setVue("membre")}
            className="group bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl p-6 text-left transition">
            <User className="mb-3" size={28} />
            <div className="font-bold text-lg">Je suis membre</div>
            <div className="text-sm text-zinc-800 mb-3">Connectez-vous avec votre code d'acc\u00e8s</div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              Acc\u00e9der <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => setVue("inscription")}
            className="group bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl p-6 text-left transition">
            <UserPlus className="mb-3" size={28} />
            <div className="font-bold text-lg">M'inscrire</div>
            <div className="text-sm text-zinc-600 mb-3">Devenir membre et profiter du tarif membre</div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              Commencer <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => setVue("visiteur")}
            className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-6 text-left transition">
            <UserPlus className="mb-3 text-amber-400" size={28} />
            <div className="font-bold text-lg">R\u00e9server sans s'inscrire</div>
            <div className="text-sm text-zinc-400 mb-3">Une ou plusieurs s\u00e9ances ponctuelles</div>
            <div className="flex items-center gap-1 font-semibold text-sm text-amber-400">
              Commencer <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            </div>
          </button>
        </div>
        <button
          onClick={() => setVue("connexion")}
          className="inline-flex items-center gap-2 mt-6 text-amber-400 hover:text-amber-300 font-semibold text-sm transition">
          <Users size={16} /> Retrouver mon dossier
        </button>
      </section>

      <section className="py-8">
        <h2 className="text-2xl font-bold text-center mb-8">Nos tarifs</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <CarteTarif
            titre="Membres"
            badge="Le plus avantageux"
            surligne
            seance={TARIFS.membre.seance}
            extra={`+ Inscription annuelle : ${fmt(TARIFS.membre.inscription)}`}
          />
          <CarteTarif
            titre="Visiteurs"
            badge="Sans engagement"
            seance={TARIFS.visiteur.seance}
            extra="Aucun frais d'inscription"
          />
        </div>
      </section>
    </div>
  );
}
