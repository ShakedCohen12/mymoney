"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
      formData.get("confirmPassword") ?? "",
    );

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("יש למלא את כל השדות.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("הסיסמה חייבת להכיל לפחות 8 תווים.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("הסיסמאות אינן תואמות.");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: fullName,
    },
  },
});

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

router.push(`/register/success?email=${encodeURIComponent(email)}`);
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
            פותחים חשבון חדש
          </h1>

          <p className="mt-2 text-[var(--color-text-secondary)]">
            כמה פרטים קטנים ומתחילים לעשות סדר בכסף
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-semibold"
            >
              שם מלא
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="שם ושם משפחה"
              className="h-14 w-full rounded-[var(--radius-medium)] border border-[var(--color-border)] px-4 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-green-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold"
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
              className="h-14 w-full rounded-[var(--radius-medium)] border border-[var(--color-border)] px-4 text-left outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-green-100"
              dir="ltr"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              סיסמה
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="לפחות 8 תווים"
              className="h-14 w-full rounded-[var(--radius-medium)] border border-[var(--color-border)] px-4 text-left outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-green-100"
              dir="ltr"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold"
            >
              אימות סיסמה
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="הקלידי שוב את הסיסמה"
              className="h-14 w-full rounded-[var(--radius-medium)] border border-[var(--color-border)] px-4 text-left outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-green-100"
              dir="ltr"
            />
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "יוצר חשבון..." : "יצירת חשבון"}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-[var(--color-text-secondary)]">
          כבר יש לך חשבון?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--color-primary)]"
          >
            להתחברות
          </Link>
        </p>
      </section>
    </main>
  );
}