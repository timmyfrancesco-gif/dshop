"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CreateShopPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    tenant: { slug: string; name: string };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    shopLogo: "",
  });

  const baseDomain =
    typeof window !== "undefined"
      ? window.location.hostname.replace(/^www\./, "")
      : "hvnmarket.com";

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

  async function handleUploadLogo(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setForm((prev) => ({ ...prev, shopLogo: data.url }));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.email || !form.password || !form.shopName) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!form.shopLogo) {
      setError("Shop logo is required");
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
          username: form.email.split("@")[0],
          password: form.password,
          shopName: form.shopName,
          shopSlug: slugify(form.shopName),
          shopLogo: form.shopLogo,
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
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
                  href={`/s/${result.tenant.slug}/dashboard`}
                  className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 transition-all hover:border-white/30 hover:text-white"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-extrabold">
                Create Your Shop
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Launch your own digital store in seconds.
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

              {/* Step 1: Account */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-6 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-white/80">
                    Account
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
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/30 focus:border-white/30"
                      placeholder="Repeat password"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.email || !form.password) {
                        setError("Fill in all fields");
                        return;
                      }
                      if (form.password.length < 8) {
                        setError("Password must be at least 8 characters");
                        return;
                      }
                      if (form.password !== form.confirmPassword) {
                        setError("Passwords don't match");
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

              {/* Step 2: Shop Name + Logo */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-6 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-white/80">
                    Your Shop
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
                    {form.shopName && (
                      <p className="mt-1.5 text-xs text-white/30">
                        URL: <span className="font-mono">{slugify(form.shopName)}.{baseDomain}</span>
                      </p>
                    )}
                  </div>

                  {/* Logo upload */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Shop Logo
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadLogo(file);
                      }}
                    />

                    {form.shopLogo ? (
                      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.shopLogo}
                          alt="Logo"
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-500/50"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white/80">
                            Logo uploaded
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((f) => ({ ...f, shopLogo: "" }));
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="mt-1 text-xs text-rose-400 transition-colors hover:text-rose-300"
                          >
                            Remove and re-upload
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/5 px-4 py-8 text-sm text-white/50 transition-all hover:border-purple-500/50 hover:text-white/70 disabled:opacity-50"
                      >
                        {uploading ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span>Click to upload your logo</span>
                          </>
                        )}
                      </button>
                    )}
                    <p className="mt-1.5 text-xs text-white/30">
                      PNG, JPG, WebP or GIF — max 2MB
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
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
                      disabled={loading || uploading}
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
