"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { registerUser } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLocale } from "@/lib/hooks/useLocale";

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";
const DISCORD_REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/auth/discord`
    : "";

const DISCORD_STATE_KEY = "hm_discord_state";

function startDiscordOAuth(e: React.MouseEvent) {
  e.preventDefault();
  const state =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.random()).slice(2);
  sessionStorage.setItem(DISCORD_STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email",
    state,
  });
  window.location.href = `https://discord.com/api/oauth2/authorize?${params}`;
}

export default function RegisterPage() {
  const { t } = useLocale();
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password) return;
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    setError(null);
    setLoading(true);
    const { data, error: err } = await registerUser({
      email: email.trim(),
      username: username.trim(),
      password,
    });
    setLoading(false);
    if (data) {
      login(data.token, data.user);
      router.push("/");
    } else {
      setError(err ?? t("auth.registerFailed"));
    }
  }

  return (
    <PageShell>
      <section className="flex min-h-[70vh] items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-background-elevated/40 p-6">
            <h1 className="text-xl font-bold text-foreground">{t("auth.register")}</h1>
            <p className="mt-1 text-sm text-muted">{t("auth.registerSubtitle")}</p>

            {/* Discord OAuth */}
            {DISCORD_CLIENT_ID && (
              <>
                <a
                  href="#"
                  onClick={startDiscordOAuth}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M20.3 4.5A18.5 18.5 0 0015.7 3l-.3.6a14 14 0 014.2 1.6 13.6 13.6 0 00-12.2 0A14 14 0 017.6 3.6L7.3 3a18.5 18.5 0 00-4.6 1.5C1 8 .5 11.4.7 14.8a13.8 13.8 0 004.1 2.1l.8-1.3a8.7 8.7 0 01-1.5-.7l.4-.3a11.7 11.7 0 009 0l.4.3a8.7 8.7 0 01-1.5.7l.8 1.3a13.8 13.8 0 004.1-2.1c.3-3.9-.6-7.3-1.9-10.3zM8.7 12.7c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.5.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.9 0 1.5.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z" />
                  </svg>
                  {t("auth.continueWithDiscord")}
                </a>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted">{t("auth.or")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("auth.usernamePlaceholder")}
                autoComplete="username"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="new-password"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                autoComplete="new-password"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent"
              />
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? t("auth.registering") : t("auth.createAccount")}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-muted">
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="text-accent hover:underline">
                {t("auth.login")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
