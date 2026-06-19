"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getFeed,
  getHealth,
  getLtcPrice,
  getProducts,
  getStats,
  getWalletInfo,
  transferFunds,
  updateProduct,
  updateProductStock,
} from "@/lib/api";
import { formatCurrency, formatEur, formatRelativeTime } from "@/lib/format";
import type { ApiProduct, FeedItem, LtcResponse, StatsResponse, WalletInfo } from "@/lib/types";

const DASHBOARD_PASSWORD = "HeavenAdmin2025";
const AUTO_REFRESH_MS = 15_000;

export default function SecretDashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      setAuthed(true);
      setError(null);
    } else {
      setError("Incorrect password.");
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-background-elevated/60 p-6"
        >
          <h1 className="text-lg font-bold text-foreground">Restricted Area</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent"
          />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return <Dashboard />;
}

/* ───────────────────────────── helpers ───────────────────────────── */

type FeedFilter = "all" | "order" | "escrow" | "mm" | "slot" | "exchange";

type ModalKind =
  | { kind: "create-product" }
  | { kind: "edit-product"; product: ApiProduct }
  | { kind: "edit-image"; product: ApiProduct }
  | { kind: "confirm-delete"; product: ApiProduct }
  | { kind: "transfer" }
  | { kind: "confirm-transfer"; amount: number; toAddress: string };

/* ───────────────────────────── Dashboard ─────────────────────────── */

function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [ltc, setLtc] = useState<LtcResponse | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [botOnline, setBotOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [productSearch, setProductSearch] = useState("");
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [statsRes, productsRes, feedRes, ltcRes, healthRes, walletRes] = await Promise.all([
      getStats(),
      getProducts(),
      getFeed(100),
      getLtcPrice(),
      getHealth(),
      getWalletInfo(),
    ]);
    if (statsRes) setStats(statsRes);
    if (productsRes?.products) setProducts(productsRes.products);
    if (feedRes?.items) setFeed(feedRes.items);
    if (ltcRes) setLtc(ltcRes);
    if (walletRes) setWallet(walletRes);
    setBotOnline(healthRes?.ok ?? false);
    setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => { refresh(); });
  }, [refresh]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refresh]);

  const filteredFeed = feedFilter === "all" ? feed : feed.filter((f) => f.type === feedFilter);

  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toString().includes(productSearch))
    : products;

  /* ── product actions ── */

  async function handleStockChange(product: ApiProduct, delta: number) {
    const newStock = Math.max(0, product.stock + delta);
    const ok = await updateProductStock(product.id, newStock);
    if (ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p)));
      showToast(`Stock di "${product.name}" aggiornato a ${newStock}`, true);
    } else {
      showToast(`Errore aggiornamento stock`, false);
    }
  }

  async function handleDeleteProduct(product: ApiProduct) {
    const ok = await deleteProduct(product.id);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" eliminato`, true);
    } else {
      showToast(`Errore eliminazione prodotto`, false);
    }
    setModal(null);
  }

  async function handleSaveProduct(data: Partial<ApiProduct> & { id?: string }) {
    if (data.id) {
      const { id, ...rest } = data;
      const updated = await updateProduct(id, rest);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
        showToast(`"${updated.name}" aggiornato`, true);
      } else {
        showToast(`Errore aggiornamento prodotto`, false);
      }
    } else {
      const created = await createProduct(data as Omit<ApiProduct, "id">);
      if (created) {
        setProducts((prev) => [...prev, created]);
        showToast(`"${created.name}" creato`, true);
      } else {
        showToast(`Errore creazione prodotto`, false);
      }
    }
    setModal(null);
  }

  async function handleImageUpdate(product: ApiProduct, newImage: string) {
    const updated = await updateProduct(product.id, { image: newImage });
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, image: newImage } : p)));
      showToast(`Immagine aggiornata`, true);
    } else {
      showToast(`Errore aggiornamento immagine`, false);
    }
    setModal(null);
  }

  async function handleTransfer(amount: number, toAddress: string) {
    const res = await transferFunds(amount, toAddress);
    if (res) {
      showToast(`Trasferimento completato! TX: ${res.txId}`, true);
      // refresh wallet balance
      const walletRes = await getWalletInfo();
      if (walletRes) setWallet(walletRes);
    } else {
      showToast(`Errore trasferimento fondi`, false);
    }
    setModal(null);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Toast */}
        {toast && (
          <div className={`fixed right-4 top-4 z-50 animate-[fadeIn_0.2s] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">HM Dashboard</h1>
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              botOnline === null
                ? "border-border text-muted"
                : botOnline
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                botOnline === null ? "bg-muted" : botOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`} />
              {botOnline === null ? "Checking..." : botOnline ? "Bot Online" : "Bot Offline"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated ? (
              <span className="text-xs text-muted">Updated {formatRelativeTime(Math.floor(lastUpdated / 1000))}</span>
            ) : null}
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-accent"
              />
              Auto (15s)
            </label>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* LTC Price Banner */}
        {ltc && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-background-elevated/40 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">LTC</span>
            <span className="font-bold text-foreground">{formatEur(ltc.eur)}</span>
            <span className="text-sm text-muted">/ ${ltc.usd.toFixed(2)}</span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
              ltc.changePct >= 0
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}>
              {ltc.changePct >= 0 ? "+" : ""}{ltc.changePct.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          <DashStatCard label="Ordini Totali" value={stats?.totalOrders ?? stats?.totalUserTrades} icon="orders" />
          <DashStatCard
            label="Volume Totale"
            value={
              stats?.totalVolumeEur !== undefined
                ? formatCurrency(stats.totalVolumeEur, "EUR")
                : stats
                  ? formatCurrency(stats.totalEscrow, "EUR")
                  : undefined
            }
            icon="volume"
            accent
          />
          <DashStatCard label="Clienti Totali" value={stats?.totalCustomers ?? stats?.totalUserTrades} icon="clients" />
          <DashStatCard label="Ticket Aperti" value={stats?.openTickets} icon="tickets" warn={stats?.openTickets !== undefined && stats.openTickets > 0} />
          <DashStatCard label="Slot Attivi" value={stats?.activeSlots} icon="slots" />
          <DashStatCard label="MM Completati" value={stats?.completedMM} icon="mm" />
          <DashStatCard label="Trade Totali" value={stats?.totalUserTrades} icon="trades" />
          <DashStatCard label="Escrow Volume" value={stats ? formatCurrency(stats.totalEscrow, "EUR") : undefined} icon="escrow" />
        </section>

        {/* ── Wallet Section ── */}
        <section className="mt-8 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background-elevated/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Wallet</h2>
            <button
              type="button"
              onClick={() => setModal({ kind: "transfer" })}
              className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90"
            >
              Trasferisci
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Balance Card */}
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted">Saldo Disponibile</div>
              <div className="mt-1 text-2xl font-bold text-amber-400">
                {wallet ? `${wallet.balance.toFixed(8)} LTC` : "---"}
              </div>
              {wallet && ltc && (
                <div className="mt-0.5 text-sm text-muted">
                  ~ {formatCurrency(wallet.balance * ltc.eur, "EUR")}
                </div>
              )}
            </div>

            {/* Address Card */}
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted">Indirizzo di Ricezione</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background-elevated px-2 py-1 font-mono text-xs text-foreground">
                  {wallet?.address ?? "---"}
                </code>
                {wallet?.address && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.address);
                      showToast("Indirizzo copiato!", true);
                    }}
                    className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    Copia
                  </button>
                )}
              </div>
              <div className="mt-1 text-[10px] text-muted">Questo indirizzo non puo essere modificato</div>
            </div>
          </div>
        </section>

        {/* ── Products Section ── */}
        <section className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">Prodotti</h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {inStock} in stock
              </span>
              {outOfStock > 0 && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400">
                  {outOfStock} esauriti
                </span>
              )}
              <span className="text-xs text-muted">
                Valore stock: {formatCurrency(totalStockValue, "EUR")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Cerca prodotto..."
                className="w-44 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setModal({ kind: "create-product" })}
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90"
              >
                + Aggiungi Prodotto
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nessun prodotto.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Img</th>
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">Prezzo</th>
                    <th className="py-2 pr-3">LTC</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2 pr-3">Valore</th>
                    <th className="py-2 pr-3">Descrizione</th>
                    <th className="py-2">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-t border-border/60 transition-colors hover:bg-background/40">
                      <td className="py-2 pr-3 font-mono text-xs text-muted">{p.id}</td>
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          onClick={() => setModal({ kind: "edit-image", product: p })}
                          className="group relative block"
                          title="Cambia immagine"
                        >
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="h-8 w-8 rounded object-cover transition-opacity group-hover:opacity-70" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-background-elevated text-xs text-muted transition-colors group-hover:border group-hover:border-accent">---</div>
                          )}
                          <span className="absolute inset-0 flex items-center justify-center rounded bg-black/50 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">edit</span>
                        </button>
                      </td>
                      <td className="py-2 pr-3 font-medium text-foreground">{p.name}</td>
                      <td className="py-2 pr-3 text-foreground">{formatCurrency(p.price, p.currency)}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted">
                        {ltc ? (p.price / ltc.eur).toFixed(8) : "---"}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStockChange(p, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs font-bold text-rose-400 transition-colors hover:border-rose-400 hover:bg-rose-500/10"
                          >
                            -
                          </button>
                          <span
                            className={`min-w-[2rem] rounded-full border px-2 py-0.5 text-center text-xs font-semibold ${
                              p.stock > 0
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockChange(p, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs font-bold text-emerald-400 transition-colors hover:border-emerald-400 hover:bg-emerald-500/10"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted">
                        {formatCurrency(p.price * p.stock, p.currency)}
                      </td>
                      <td className="max-w-[12rem] truncate py-2 pr-3 text-xs text-muted">{p.description}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModal({ kind: "edit-product", product: p })}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ kind: "confirm-delete", product: p })}
                            className="rounded-lg border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
                          >
                            Elimina
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Activity Feed ── */}
        <section className="mt-8 rounded-2xl border border-border bg-background-elevated/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Attivita Live</h2>
            <div className="flex gap-1.5">
              {(["all", "order", "escrow", "mm", "slot", "exchange"] as FeedFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeedFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    feedFilter === f
                      ? "bg-accent text-background"
                      : "bg-background/60 text-muted hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "Tutti" : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredFeed.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nessuna attivita.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-0 text-sm">
              {filteredFeed.map((item, i) => (
                <li key={i} className="flex items-center gap-3 border-t border-border/60 py-2.5 first:border-t-0">
                  <FeedTypeBadge type={item.type} />
                  <span className="flex-1 text-foreground">
                    {item.label}
                    {item.method ? <span className="ml-1 text-xs text-muted">- {item.method}</span> : ""}
                  </span>
                  {item.amount !== undefined && (
                    <span className="font-semibold text-foreground">{formatCurrency(item.amount, "EUR")}</span>
                  )}
                  <span className="shrink-0 text-xs text-muted">{formatRelativeTime(item.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-muted">
          Auto-refresh {autoRefresh ? "attivo" : "disattivato"} - {products.length} prodotti - {feed.length} eventi caricati
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.kind === "create-product" && (
        <ProductFormModal
          title="Nuovo Prodotto"
          onSave={(data) => handleSaveProduct(data)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "edit-product" && (
        <ProductFormModal
          title="Modifica Prodotto"
          initial={modal.product}
          onSave={(data) => handleSaveProduct({ ...data, id: modal.product.id })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "edit-image" && (
        <ImageModal
          product={modal.product}
          onSave={(url) => handleImageUpdate(modal.product, url)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "confirm-delete" && (
        <ConfirmModal
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare "${modal.product.name}"? Questa azione non puo essere annullata.`}
          confirmLabel="Elimina"
          confirmClass="bg-rose-500 text-white hover:bg-rose-600"
          onConfirm={() => handleDeleteProduct(modal.product)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "transfer" && (
        <TransferModal
          balance={wallet?.balance ?? 0}
          onTransfer={(amount, toAddress) => setModal({ kind: "confirm-transfer", amount, toAddress })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "confirm-transfer" && (
        <ConfirmModal
          title="Conferma Trasferimento"
          message={`Vuoi trasferire ${modal.amount.toFixed(8)} LTC a ${modal.toAddress}?`}
          confirmLabel="Conferma Trasferimento"
          confirmClass="bg-amber-500 text-black hover:bg-amber-600"
          onConfirm={() => handleTransfer(modal.amount, modal.toAddress)}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}

/* ───────────────────────────── Modals ────────────────────────────── */

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ProductFormModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial?: ApiProduct;
  onSave: (data: Partial<ApiProduct>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "EUR");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;
    setSaving(true);
    onSave({
      name: name.trim(),
      price: parseFloat(price),
      currency,
      description: description.trim(),
      image: image.trim() || undefined,
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="mb-4 text-base font-bold text-foreground">{title}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Nome *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Prezzo *
            <input
              type="number"
              step="any"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Valuta
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="LTC">LTC</option>
              <option value="BTC">BTC</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Descrizione
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          URL Immagine
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim() || !price.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ImageModal({
  product,
  onSave,
  onClose,
}: {
  product: ApiProduct;
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(product.image ?? "");
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    onSave(url.trim());
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="mb-4 text-base font-bold text-foreground">Cambia Immagine - {product.name}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {url.trim() && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="preview" className="h-24 w-24 rounded-lg object-cover" />
          </div>
        )}
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          autoFocus
          className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground">
            Annulla
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50">
            {saving ? "..." : "Salva"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function TransferModal({
  balance,
  onTransfer,
  onClose,
}: {
  balance: number;
  onTransfer: (amount: number, toAddress: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !toAddress.trim()) return;
    onTransfer(numAmount, toAddress.trim());
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="mb-4 text-base font-bold text-foreground">Trasferisci Fondi</h3>
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
        <span className="text-muted">Saldo disponibile: </span>
        <span className="font-bold text-amber-400">{balance.toFixed(8)} LTC</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Importo (LTC) *
          <input
            type="number"
            step="any"
            min="0.00000001"
            max={balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00000000"
            className="rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Indirizzo Destinazione *
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            required
            placeholder="ltc1q..."
            className="rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground">
            Annulla
          </button>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || !toAddress.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Continua
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
      <p className="mb-6 text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground">
          Annulla
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            onConfirm();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-opacity disabled:opacity-50 ${confirmClass}`}
        >
          {busy ? "..." : confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ───────────────────────────── Small Components ──────────────────── */

const STAT_ICONS: Record<string, string> = {
  orders: "📦",
  volume: "💰",
  clients: "👥",
  tickets: "🎫",
  slots: "📢",
  mm: "🤝",
  trades: "🔄",
  escrow: "🔒",
};

function DashStatCard({
  label,
  value,
  icon,
  accent,
  warn,
}: {
  label: string;
  value?: string | number;
  icon?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      warn
        ? "border-amber-500/30 bg-amber-500/5"
        : accent
          ? "border-accent/30 bg-accent/5"
          : "border-border bg-background-elevated/40"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-xl font-bold ${
          warn ? "text-amber-400" : accent ? "text-accent" : "text-foreground"
        }`}>
          {value ?? "---"}
        </span>
        {icon ? <span className="text-lg">{STAT_ICONS[icon] ?? icon}</span> : null}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

const FEED_TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-500",
  escrow: "bg-emerald-500",
  mm: "bg-amber-500",
  slot: "bg-purple-500",
  exchange: "bg-cyan-500",
};

function FeedTypeBadge({ type }: { type: string }) {
  return (
    <span className={`flex h-6 shrink-0 items-center rounded px-1.5 text-[10px] font-bold uppercase text-white ${FEED_TYPE_COLORS[type] ?? "bg-muted"}`}>
      {type}
    </span>
  );
}
