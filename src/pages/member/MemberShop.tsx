import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { shopApi } from "../../services/api";
import { Select } from "../../components/ui";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

const PAY_OPTIONS = [
  { value: "WAVE", label: "Wave" },
  { value: "CASH", label: "Cash a l'accueil" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "MTN_MONEY", label: "MTN Money" },
  { value: "CARD", label: "Carte" },
  { value: "BANK_TRANSFER", label: "Virement bancaire" },
];

export function MemberShop() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product_id: number; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("WAVE");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await shopApi.getProducts(true);
      setProducts(data.data || []);
    } catch {
      setMessage({ type: "error", text: "Impossible de charger la boutique" });
    } finally {
      setLoading(false);
    }
  };

  const cartLines = useMemo(() => cart.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    return product ? { ...item, product, total: Number(product.price) * item.quantity } : null;
  }).filter(Boolean) as { product_id: number; quantity: number; product: any; total: number }[], [cart, products]);

  const total = cartLines.reduce((sum, line) => sum + line.total, 0);

  const setQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product_id !== productId));
      return;
    }
    const product = products.find((p) => p.id === productId);
    const boundedQuantity = Math.min(quantity, Number(product?.stock_quantity || quantity));
    setCart((prev) => {
      const exists = prev.find((item) => item.product_id === productId);
      if (exists) return prev.map((item) => item.product_id === productId ? { ...item, quantity: boundedQuantity } : item);
      return [...prev, { product_id: productId, quantity: boundedQuantity }];
    });
  };

  const checkout = async () => {
    if (cart.length === 0) {
      setMessage({ type: "error", text: "Ajoutez au moins un produit au panier" });
      return;
    }

    setSaving(true);
    try {
      await shopApi.createSale({
        payment_method: paymentMethod,
        items: cart,
        notes: "Achat membre depuis l'espace boutique",
      });
      setMessage({ type: "success", text: "Achat enregistre. Presentez-vous a l'accueil pour recuperer vos articles." });
      setCart([]);
      load();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Impossible d'enregistrer l'achat" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Boutique</h1>
          <p className="text-sm text-zinc-400 mt-1">Commandez les articles disponibles dans votre salle.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm">
          <ShoppingBag size={16} className="text-amber-400" />
          <span className="text-zinc-400">{cart.length} article(s)</span>
        </div>
      </div>

      {message.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <ShoppingBag className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucun produit disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {products.map((product) => {
              const quantity = cart.find((item) => item.product_id === product.id)?.quantity || 0;
              const stock = Number(product.stock_quantity || 0);
              return (
                <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{product.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{product.category}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${stock > 5 ? "bg-green-500/10 text-green-400" : "bg-amber-400/10 text-amber-400"}`}>
                      Stock {stock}
                    </span>
                  </div>
                  {product.description && <p className="text-sm text-zinc-400 mt-3">{product.description}</p>}
                  <div className="text-2xl font-black text-amber-400 mt-4">{fmt(Number(product.price))}</div>
                  {quantity === 0 ? (
                    <button
                      disabled={stock === 0}
                      onClick={() => setQuantity(product.id, 1)}
                      className="w-full mt-4 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition">
                      Ajouter
                    </button>
                  ) : (
                    <div className="mt-4 flex items-center justify-between bg-zinc-950 border border-zinc-700 rounded-lg p-2">
                      <button onClick={() => setQuantity(product.id, quantity - 1)} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700"><Minus size={14} /></button>
                      <span className="font-bold">{quantity}</span>
                      <button onClick={() => setQuantity(product.id, quantity + 1)} disabled={quantity >= stock} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"><Plus size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-fit lg:sticky lg:top-28">
            <h2 className="font-bold mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-amber-400" /> Panier</h2>
            {cartLines.length === 0 ? (
              <p className="text-sm text-zinc-500">Votre panier est vide.</p>
            ) : (
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.product_id} className="flex items-start justify-between gap-3 text-sm border-b border-zinc-800 pb-3 last:border-0">
                    <div>
                      <div className="font-medium">{line.product.name}</div>
                      <div className="text-xs text-zinc-500">x{line.quantity} · {fmt(Number(line.product.price))}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{fmt(line.total)}</span>
                      <button onClick={() => setQuantity(line.product_id, 0)} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-black text-amber-400">{fmt(total)}</span>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Paiement</label>
                  <Select value={paymentMethod} onChange={setPaymentMethod} options={PAY_OPTIONS} />
                </div>
                <button
                  disabled={saving}
                  onClick={checkout}
                  className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold py-2.5 rounded-lg text-sm">
                  {saving ? "Enregistrement..." : "Confirmer l'achat"}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
