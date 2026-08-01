"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  LoaderCircle,
  RefreshCcw,
  Smartphone,
  WalletCards,
} from "lucide-react";

type ConnectResponse = {
  ok: boolean;
  token?: string;
  connectionId?: string;
  createdAt?: string;
  error?: string;
};

export default function AppleWalletConnection() {
  const [token, setToken] = useState("");
  const [isCreating, setIsCreating] =
    useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function createConnection() {
    setIsCreating(true);
    setCopied(false);
    setError("");

    try {
      const response = await fetch(
        "/api/wallet/connect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result =
        (await response.json()) as ConnectResponse;

      if (!response.ok || !result.ok || !result.token) {
        throw new Error(
          result.error ||
            "לא הצלחנו ליצור את החיבור."
        );
      }

      setToken(result.token);
    } catch (caughtError) {
      console.error(
        "Create Wallet connection error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו ליצור את החיבור."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyToken() {
    if (!token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (caughtError) {
      console.error(
        "Copy Wallet token error:",
        caughtError
      );

      setError(
        "לא הצלחנו להעתיק את הקוד. אפשר לסמן ולהעתיק אותו ידנית."
      );
    }
  }

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-small)]"
    >
      <div className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <WalletCards
                size={26}
                strokeWidth={2.2}
              />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-[var(--color-text)]">
                חיבור Apple Wallet
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                צרי קוד אישי והכניסי אותו
                לאוטומציה באפליקציית קיצורים. כל
                עסקה שתישלח תישמר בחשבון שלך.
              </p>
            </div>
          </div>

          {!token ? (
            <button
              type="button"
              onClick={() =>
                void createConnection()
              }
              disabled={isCreating}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-4 font-black text-white shadow-[var(--shadow-medium)] transition active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
            >
              {isCreating ? (
                <>
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                  יוצר חיבור...
                </>
              ) : (
                <>
                  <Smartphone size={20} />
                  יצירת קוד חיבור
                </>
              )}
            </button>
          ) : (
            <div className="mt-6">
              <div className="rounded-3xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)]/50 p-4">
                <p className="text-sm font-black text-[var(--color-text)]">
                  קוד החיבור האישי שלך
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  הקוד מוצג עכשיו בלבד. אל תשתפי
                  אותו עם אף אחד.
                </p>

                <div className="mt-4 flex items-stretch gap-2">
                  <input
                    type="text"
                    readOnly
                    value={token}
                    className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-xs text-[var(--color-text)] outline-none"
                    dir="ltr"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void copyToken()
                    }
                    className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white transition active:scale-95"
                    aria-label="העתקת קוד החיבור"
                  >
                    {copied ? (
                      <Check size={20} />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>

                {copied && (
                  <p className="mt-2 text-xs font-bold text-emerald-500">
                    הקוד הועתק
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void createConnection()
                }
                disabled={isCreating}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm font-bold text-[var(--color-text)] transition active:scale-[0.985] disabled:opacity-60"
              >
                <RefreshCcw size={17} />
                יצירת קוד חדש
              </button>

              <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                יצירת קוד חדש מבטלת את הקוד הקודם.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}