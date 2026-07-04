"use client";

import { useCallback, useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  category: string;
  active: boolean;
  sortOrder: number;
  totalSold: number;
  stock: number;
}
interface StockItem {
  id: string;
  content: string;
  status: string;
  soldAt: string | null;
}

const card = { backgroundColor: "#121214" };
const input =
  "w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white outline-none transition-all focus:border-[#90C6FF]/50";

export default function InventoryPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [logging, setLogging] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store/admin/products");
      if (res.ok) setProducts((await res.json()).products);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function login() {
    setLogging(true);
    setPwError("");
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) setAuthed(true);
      else setPwError("Password errata.");
    } catch {
      setPwError("Errore di rete.");
    } finally {
      setLogging(false);
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: "40px 32px", maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>📦</div>
          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Magazzino</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Dashboard password"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
          {pwError && <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>{pwError}</p>}
          <button onClick={login} disabled={logging} style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 8, background: "#90C6FF", color: "#001", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
            {logging ? "…" : "Accedi"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px" }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Magazzino</h1>
            <p className="text-sm text-zinc-500">Prodotti e stock — salvati su Postgres, affidabili.</p>
          </div>
          <button onClick={load} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:border-[#90C6FF]/40">
            {loading ? "…" : "↻ Aggiorna"}
          </button>
        </div>

        <CreateProduct onCreated={load} showToast={showToast} />

        <div className="mt-6 flex flex-col gap-3">
          {products.length === 0 ? (
            <p className="rounded-xl border border-white/5 p-8 text-center text-sm text-zinc-500" style={card}>
              Nessun prodotto. Creane uno sopra.
            </p>
          ) : (
            products.map((p) => <ProductRow key={p.id} product={p} onChange={load} showToast={showToast} />)
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold ${toast.ok ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function CreateProduct({ onCreated, showToast }: { onCreated: () => void; showToast: (m: string, ok: boolean) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      const res = await fetch("/api/store/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: parseFloat(price) }),
      });
      if (res.ok) {
        setName("");
        setPrice("");
        showToast("Prodotto creato", true);
        onCreated();
      } else {
        showToast((await res.json()).error || "Errore", false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/5 p-4" style={card}>
      <h3 className="mb-3 text-sm font-semibold">Nuovo prodotto</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className={input} style={{ backgroundColor: "#161619" }} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="Prezzo €" className={`${input} sm:w-40`} style={{ backgroundColor: "#161619" }} />
        <button onClick={create} disabled={saving} className="rounded-lg bg-[#90C6FF] px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50">
          {saving ? "…" : "Crea"}
        </button>
      </div>
    </div>
  );
}

function ProductRow({ product, onChange, showToast }: { product: Product; onChange: () => void; showToast: (m: string, ok: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      const res = await fetch(`/api/store/admin/products/${product.id}`);
      if (res.ok) setItems((await res.json()).items);
    }
  }

  async function submitStock() {
    const lines = draft.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0 && mode === "add") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/admin/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines, mode }),
      });
      if (res.ok) {
        setDraft("");
        showToast(`Stock aggiornato: ${(await res.json()).stock} disponibili`, true);
        const r = await fetch(`/api/store/admin/products/${product.id}`);
        if (r.ok) setItems((await r.json()).items);
        onChange();
      } else {
        showToast((await res.json()).error || "Errore", false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Eliminare "${product.name}"?`)) return;
    const res = await fetch(`/api/store/admin/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Prodotto eliminato", true);
      onChange();
    }
  }

  async function toggleActive() {
    await fetch(`/api/store/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    onChange();
  }

  const available = items ? items.filter((i) => i.status === "available").length : product.stock;

  return (
    <div className="rounded-xl border border-white/5" style={card}>
      <div className="flex items-center justify-between gap-3 p-4">
        <button onClick={toggle} className="flex-1 text-left">
          <p className="font-semibold text-white">{product.name}</p>
          <p className="text-xs text-zinc-500">€{product.price.toFixed(2)} · {product.totalSold} venduti</p>
        </button>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.stock > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
          {product.stock} in stock
        </span>
        <button onClick={toggleActive} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${product.active ? "border-emerald-500/30 text-emerald-400" : "border-white/10 text-zinc-500"}`}>
          {product.active ? "Attivo" : "Nascosto"}
        </button>
        <button onClick={toggle} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300">{open ? "▲" : "Stock ▼"}</button>
      </div>

      {open && (
        <div className="border-t border-white/5 p-4">
          <div className="mb-3 flex gap-2">
            <button onClick={() => setMode("add")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === "add" ? "bg-[#90C6FF]/20 text-[#90C6FF]" : "text-zinc-500"}`}>Aggiungi</button>
            <button onClick={() => setMode("replace")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === "replace" ? "bg-[#90C6FF]/20 text-[#90C6FF]" : "text-zinc-500"}`}>Sostituisci</button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder={"Un articolo per riga\nSERIAL-001\nSERIAL-002"}
            className="w-full rounded-lg border border-white/10 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-[#90C6FF]/50"
            style={{ backgroundColor: "#161619" }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {draft.trim() ? `${draft.trim().split("\n").filter((l) => l.trim()).length} righe` : `${available} disponibili ora`}
            </span>
            <div className="flex gap-2">
              <button onClick={remove} className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-400">Elimina</button>
              <button onClick={submitStock} disabled={busy} className="rounded-lg bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-400 disabled:opacity-50">
                {busy ? "…" : mode === "replace" ? "Sostituisci stock" : "Aggiungi allo stock"}
              </button>
            </div>
          </div>

          {items && items.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-white/5 p-2" style={{ backgroundColor: "#161619" }}>
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between py-1 font-mono text-[11px]">
                  <span className={it.status === "sold" ? "text-zinc-600 line-through" : "text-zinc-300"}>{it.content}</span>
                  <span className={it.status === "sold" ? "text-zinc-600" : "text-emerald-500"}>{it.status === "sold" ? "venduto" : "disp."}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
