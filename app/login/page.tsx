"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setErrorMessage("יש למלא אימייל וסיסמה.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage("האימייל או הסיסמה אינם נכונים.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6 py-10"
    >
      <section className="w-full max-w-md rounded-[var(--radius-extra-large)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-large)]">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        >
          → חזרה
        </Link>

        <div className="mb-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-2xl font-bold text-white">
            ₪
          </div>

          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            כיף שחזרת
          </h1>

          <p className="mt-2 text-[var(--color-text-secondary)]">
            התחברי כדי להמשיך לנהל את הכסף שלך
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
            >
              כתובת אימייל
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="h-14 w-full rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white px-4 text-left outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-green-100"
              dir="ltr"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                סיסמה
              </label>

              <button
                type="button"
                className="text-sm font-medium text-[var(--color-primary)]"
              >
                שכחתי סיסמה
              </button>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-14 w-full rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white px-4 text-left outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-green-100"
              dir="ltr"
            />
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            זכור אותי
          </label>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "מתחבר..." : "התחברות"}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-[var(--color-text-secondary)]">
          עדיין אין לך חשבון?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--color-primary)]"
          >
            להרשמה
          </Link>
        </p>
      </section>
    </main>
  );
}