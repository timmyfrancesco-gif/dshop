"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CreateShopPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    tenant: { slug: string; name: string };
  } | null>(null);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    shopName: "",
    shopSlug: "",
  });

  const baseDomain =
    typeof window !== "undefined"
      ? window.location.hostname.replace(/^www\./, "")
      : "heavenmarket.com";

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
  }

  async function handleSubmit() {
    if (!form.email || !form.username || !form.password || !form.shopName) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tenants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          password: form.password,
          shopName: form.shopName,
          shopSlug: form.shopSlug || slugify(form.shopName),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
      setStep(3);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07050d] text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Heaven Market
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:border-white/40"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {step === 3 && result ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
                ✓
              </div>
              <h2 className="mt-6 text-2xl font-extrabold">
                Shop Created!
              </h2>
              <p className="mt-3 text-white/60">
                Your shop <strong>{result.tenant.name}</strong> is live at:
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm">
                {result.tenant.slug}.{baseDomain}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/s/${result.tenant.slug}`}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-bold transition-all hover:opacity-90"
                >
                  Visit Your Shop
                </Link>
                <Link
                  href="/"
                  className="text-sm text-white/40 transition-colors hover:text-white/60"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-extrabold">
                Create Your Shop
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Launch your own digital store in seconds. No coding required.
              </p>

              {/* Progress */}
              <div className="mt-6 flex items-center gap-2">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      step >= s ? "bg-purple-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-6 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-white/80">
                    Account Details
                  </h3>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Username
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                      placeholder="yourname"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Password
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.email || !form.username || !form.password) {
                        setError("Fill in all fields");
                        return;
                      }
                      if (form.password.length < 8) {
                        setError("Password must be at least 8 characters");
                        return;
                      }
                      setError("");
                      setStep(2);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-sm font-bold transition-all hover:opacity-90"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-6 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-white/80">
                    Shop Details
                  </h3>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={form.shopName}
                      onChange={(e) => updateField("shopName", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                      placeholder="My Awesome Shop"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Shop URL (optional)
                    </label>
                    <div className="flex items-center gap-0 rounded-xl border border-white/10 bg-white/5">
                      <input
                        type="text"
                        value={form.shopSlug}
                        onChange={(e) =>
                          updateField("shopSlug", slugify(e.target.value))
                        }
                        className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/30"
                        placeholder={slugify(form.shopName || "my-shop")}
                      />
                      <span className="pr-4 text-xs text-white/40">
                        .{baseDomain}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/60 transition-colors hover:border-white/30"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Shop"}
                    </button>
                  </div>
                </motion.div>
              )}

              {error && (
                <p className="mt-4 text-center text-sm text-rose-400">
                  {error}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
