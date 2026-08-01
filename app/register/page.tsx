"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    const formData = new FormData(
      event.currentTarget
    );

    const fullName = String(
      formData.get("fullName") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    ).trim();

    const password = String(
      formData.get("password") ?? ""
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage(
        "יש למלא את כל השדות."
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "הסיסמה חייבת להכיל לפחות 8 תווים."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "הסיסמאות אינן תואמות."
      );
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.signUp({
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

    router.push(
      `/register/success?email=${encodeURIComponent(
        email
      )}`
    );
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090A16] px-5 py-10 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-36 -top-36 h-[420px] w-[420px] rounded-full bg-fuchsia-500/25 blur-[120px]" />

        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[120px]" />

        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[110px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <section className="relative w-full max-w-lg overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#A8B0C7] transition hover:text-white"
        >
          <ArrowRight size={17} />
          חזרה
        </Link>

        <div className="mt-8 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 text-2xl font-black shadow-[0_14px_45px_rgba(236,72,153,0.4)]">
            MS
          </div>

          <div>
            <h1 className="text-3xl font-black">
              פותחים חשבון חדש
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#A8B0C7]">
              כמה פרטים קטנים ומתחילים לעשות סדר בכסף
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2">
          {[
            "מעקב חכם",
            "יעדי חיסכון",
            "תובנות AI",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/20 px-2 py-3 text-center text-[11px] font-bold text-violet-100"
            >
              <Check
                size={13}
                className="text-cyan-300"
              />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-200">
          <Sparkles size={14} />
          מתחילים חכם מהרגע הראשון
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={handleRegister}
        >
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-bold"
            >
              שם מלא
            </label>

            <div className="relative">
              <UserRound
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fuchsia-300"
              />

              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="שם ושם משפחה"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 text-white outline-none transition placeholder:text-[#6F7892] focus:border-fuchsia-400/50 focus:ring-4 focus:ring-fuchsia-500/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold"
            >
              כתובת אימייל
            </label>

            <div className="relative">
              <Mail
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fuchsia-300"
              />

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 text-left text-white outline-none transition placeholder:text-[#6F7892] focus:border-fuchsia-400/50 focus:ring-4 focus:ring-fuchsia-500/10"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold"
            >
              סיסמה
            </label>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fuchsia-300"
              />

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="לפחות 8 תווים"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 text-left text-white outline-none transition placeholder:text-[#6F7892] focus:border-fuchsia-400/50 focus:ring-4 focus:ring-fuchsia-500/10"
                dir="ltr"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8B0C7] transition hover:text-white"
                aria-label={
                  showPassword
                    ? "הסתרת סיסמה"
                    : "הצגת סיסמה"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-bold"
            >
              אימות סיסמה
            </label>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fuchsia-300"
              />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                required
                autoComplete="new-password"
                placeholder="הקלידי שוב את הסיסמה"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 text-left text-white outline-none transition placeholder:text-[#6F7892] focus:border-fuchsia-400/50 focus:ring-4 focus:ring-fuchsia-500/10"
                dir="ltr"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8B0C7] transition hover:text-white"
                aria-label={
                  showConfirmPassword
                    ? "הסתרת אימות סיסמה"
                    : "הצגת אימות סיסמה"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 text-base font-black text-white shadow-[0_14px_40px_rgba(236,72,153,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading
              ? "יוצרת חשבון..."
              : "יצירת חשבון"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[#A8B0C7]">
          כבר יש לך חשבון?{" "}
          <Link
            href="/login"
            className="font-black text-cyan-300 transition hover:text-cyan-200"
          >
            התחברות
          </Link>
        </p>
      </section>
    </main>
  );
}