"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import { loginWithDiscord } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLocale } from "@/lib/hooks/useLocale";

function DiscordCallbackContent() {
  const { t } = useLocale();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError(t("auth.discordNoCode"));
      return;
    }
    loginWithDiscord(code).then(({ data, error: err }) => {
      if (data) {
        login(data.token, data.user);
        router.push("/");
      } else {
        setError(err ?? t("auth.discordFailed"));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-border bg-background-elevated/40 p-8">
          {error ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-500/40 bg-rose-500/10">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-rose-400">{error}</p>
              <a href="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
                {t("auth.backToLogin")}
              </a>
            </>
          ) : (
            <>
              <svg className="mx-auto h-10 w-10 animate-spin text-accent" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="mt-4 text-sm text-muted">{t("auth.discordLoading")}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function DiscordCallbackPage() {
  return (
    <PageShell>
      <Suspense fallback={
        <section className="flex min-h-[70vh] items-center justify-center">
          <p className="text-sm text-muted">Loading...</p>
        </section>
      }>
        <DiscordCallbackContent />
      </Suspense>
    </PageShell>
  );
}
