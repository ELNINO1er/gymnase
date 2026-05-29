import { useState } from "react";
import { Download, QrCode } from "lucide-react";

export function GenerateurQR() {
  const [url, setUrl] = useState("https://ma-salle-de-gym.com");
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=18181b&bgcolor=fbbf24`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex bg-amber-400/10 text-amber-400 p-3 rounded-xl mb-3">
          <QrCode size={28} />
        </div>
        <h2 className="text-3xl font-bold mb-2">G\u00e9n\u00e9rateur de QR Code</h2>
        <p className="text-zinc-400">Saisissez l'adresse de votre application en ligne. Le QR code se g\u00e9n\u00e8re automatiquement, imprimez-le et affichez-le dans votre salle !</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">URL de votre application</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="inline-block bg-amber-400 p-4 rounded-2xl">
          <img src={qrSrc} alt="QR Code" className="rounded-lg" width={300} height={300} />
        </div>
        <p className="text-zinc-400 text-sm mt-4 break-all">{url}</p>
        <a
          href={qrSrc}
          download="qrcode-elite-gym.png"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition mt-5">
          <Download size={18} /> T\u00e9l\u00e9charger le QR Code
        </a>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mt-6 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-300 mb-2">Comment mettre votre application en ligne ?</p>
        <p className="mb-1">1. H\u00e9bergez cette application sur un service gratuit comme <span className="text-amber-400">Vercel</span> ou <span className="text-amber-400">Netlify</span>.</p>
        <p className="mb-1">2. Copiez l'adresse (URL) obtenue et collez-la ci-dessus.</p>
        <p>3. T\u00e9l\u00e9chargez le QR code, imprimez-le et placez-le \u00e0 l'entr\u00e9e de votre salle.</p>
      </div>
    </div>
  );
}
