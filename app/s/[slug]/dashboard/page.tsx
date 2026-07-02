"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface TenantSettings {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  theme: string;
  accentColor: string | null;
  discordInvite: string | null;
  ltcAddress: string | null;
  paypalEmail: string | null;
  feePct: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  totalSold: number;
  active: boolean;
}

export default function TenantDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tenant, setTenant] = useState<TenantSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "settings">("overview");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    logo: "",
    discordInvite: "",
    ltcAddress: "",
    paypalEmail: "",
    theme: "hyper",
    accentColor: "#6571FF",
  });

  const loadData = useCallback(async (tenantId: string) => {
    try {
      const [settingsRes, productsRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/settings`),
        fetch(`/api/tenants/${tenantId}/products`),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setTenant(data);
        setEditForm({
          name: data.name ?? "",
          description: data.description ?? "",
          logo: data.logo ?? "",
          discordInvite: data.discordInvite ?? "",
          ltcAddress: data.ltcAddress ?? "",
          paypalEmail: data.paypalEmail ?? "",
          theme: data.theme ?? "hyper",
          accentColor: data.accentColor ?? "#6571FF",
        });
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError("");

    try {
      const settingsRes = await fetch(`/api/tenants/by-slug/${slug}`);
      if (!settingsRes.ok) {
        setLoginError("Shop not found");
        return;
      }
      const tenantData = await settingsRes.json();

      const res = await fetch(`/api/tenants/${tenantData.id}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }

      setAuthed(true);
      await loadData(tenantData.id);
    } catch {
      setLoginError("Network error");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSaveSettings() {
    if (!tenant) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(`/api/tenants/${tenant.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setSaveMsg("Settings saved!");
        await loadData(tenant.id);
      } else {
        const data = await res.json();
        setSaveMsg(data.error || "Failed to save");
      }
    } catch {
      setSaveMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8"
        >
          <h2 className="text-xl font-extrabold text-white">
            Dashboard Login
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Sign in to manage <strong>{slug}</strong>
          </p>
          <div className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
            />
            <button
              type="button"
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full rounded-xl bg-[#6571FF] py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
            {loginError && (
              <p className="text-center text-sm text-rose-400">{loginError}</p>
            )}
          </div>
          <Link
            href={`/s/${slug}`}
            className="mt-4 block text-center text-sm text-white/40 transition-colors hover:text-white/60"
          >
            Back to Shop
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Dashboard Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo} alt="" className="h-8 w-8 rounded-full" />
            )}
            <div>
              <h1 className="text-lg font-bold">{tenant?.name ?? slug}</h1>
              <p className="text-xs text-white/40">Dashboard</p>
            </div>
          </div>
          <Link
            href={`/s/${slug}`}
            className="rounded-full border border-white/20 px-4 py-2 text-sm transition-colors hover:border-white/40"
          >
            View Shop
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["overview", "products", "settings"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? "bg-[#6571FF] text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/50">Products</p>
                <p className="mt-1 text-3xl font-bold">{products.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/50">Total Stock</p>
                <p className="mt-1 text-3xl font-bold">
                  {products.reduce((s, p) => s + p.stock, 0)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/50">Total Sold</p>
                <p className="mt-1 text-3xl font-bold">
                  {products.reduce((s, p) => s + p.totalSold, 0)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-semibold text-white/80">Shop URL</h3>
              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white/60">
                {typeof window !== "undefined" ? window.location.origin : ""}/s/{slug}
              </div>
              {tenant?.feePct !== undefined && (
                <p className="mt-3 text-xs text-white/40">
                  Platform fee: {tenant.feePct}% on each sale
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
                <p className="text-lg font-semibold text-white/60">No products yet</p>
                <p className="mt-2 text-sm text-white/40">
                  Product management coming soon. You&apos;ll be able to add, edit, and manage your products here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4"
                  >
                    <div>
                      <h4 className="font-semibold">{p.name}</h4>
                      <p className="mt-0.5 text-sm text-white/50">
                        Stock: {p.stock} &middot; Sold: {p.totalSold}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">&euro;{p.price.toFixed(2)}</p>
                      <span
                        className={`text-xs font-semibold ${
                          p.active ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
          >
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
                General
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={editForm.logo}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, logo: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                    placeholder="https://example.com/logo.png"
                  />
                  {editForm.logo && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editForm.logo}
                        alt="Logo"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
                Integrations
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Discord Invite Link
                  </label>
                  <input
                    type="url"
                    value={editForm.discordInvite}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, discordInvite: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                    placeholder="https://discord.gg/..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    LTC Address (for receiving payments)
                  </label>
                  <input
                    type="text"
                    value={editForm.ltcAddress}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, ltcAddress: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-mono outline-none focus:border-white/30"
                    placeholder="ltc1q..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    PayPal Email (Friends &amp; Family — leave empty to disable PayPal)
                  </label>
                  <input
                    type="email"
                    value={editForm.paypalEmail}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, paypalEmail: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
                    placeholder="you@paypal-email.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="rounded-xl bg-[#6571FF] px-8 py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              {saveMsg && (
                <span
                  className={`text-sm ${
                    saveMsg.includes("saved") ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {saveMsg}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
