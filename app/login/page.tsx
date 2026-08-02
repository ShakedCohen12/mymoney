"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

async function handleLogin(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setErrorMessage("");
  setIsLoading(true);

  try {
    const formData = new FormData(
      event.currentTarget
    );

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") ?? ""
    );

    if (!email || !password) {
      setErrorMessage(
        "יש למלא כתובת אימייל וסיסמה."
      );
      return;
    }

    const supabase = createClient();

    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      const message =
        error.message.toLowerCase();

      if (
        message.includes(
          "email not confirmed"
        )
      ) {
        setErrorMessage(
          "כתובת האימייל עדיין לא אומתה. יש לפתוח את הודעת האימות וללחוץ על הקישור."
        );
        return;
      }

      if (
        message.includes(
          "invalid login credentials"
        )
      ) {
        setErrorMessage(
          "כתובת האימייל או הסיסמה אינן נכונות."
        );
        return;
      }

      if (
        message.includes("rate limit") ||
        message.includes("too many")
      ) {
        setErrorMessage(
          "בוצעו יותר מדי ניסיונות התחברות. נסו שוב בעוד כמה דקות."
        );
        return;
      }

      setErrorMessage(
        `לא הצלחנו להתחבר: ${error.message}`
      );
      return;
    }

    if (!data.user || !data.session) {
      console.error(
        "Login succeeded without user/session:",
        data
      );

      setErrorMessage(
        "ההתחברות לא הושלמה. נסו להתחבר מחדש."
      );
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  } catch (caughtError) {
    console.error(
      "Unexpected login error:",
      caughtError
    );

    setErrorMessage(
      "אירעה שגיאה בחיבור. בדקו את החיבור לאינטרנט ונסו שוב."
    );
  } finally {
    setIsLoading(false);
  }
}

async function handleGoogleLogin() {
  setErrorMessage("");
  setIsLoading(true);

  try {
    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      console.error(
        "Google login error:",
        error
      );

      setErrorMessage(
        `לא הצלחנו להתחבר עם Google: ${error.message}`
      );

      setIsLoading(false);
    }
  } catch (error) {
    console.error(
      "Unexpected Google login error:",
      error
    );

    setErrorMessage(
      "אירעה שגיאה בהתחברות עם Google."
    );

    setIsLoading(false);
  }
}

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090A16] px-5 py-10 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet-600/30 blur-[120px]" />

        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-[120px]" />

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

      <section className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#A8B0C7] transition hover:text-white"
        >
          <ArrowRight size={17} />
          חזרה
        </Link>

        <div className="mt-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-2xl font-black shadow-[0_14px_45px_rgba(139,92,246,0.45)]">
              MS
            </div>

            <div>
              <h1 className="text-3xl font-black">
               ברוכים השבים
              </h1>

              <p className="mt-1 text-sm text-[#A8B0C7]">
               התחברו והמשיכו לנהל את הכסף שלכם
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-200">
          <Sparkles size={14} />
          MiSaldoAI מחכה לך
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={handleLogin}
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-white"
            >
              כתובת אימייל
            </label>

            <div className="relative">
              <Mail
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-violet-300"
              />

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 text-left text-white outline-none transition placeholder:text-[#6F7892] focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-bold text-white"
              >
                סיסמה
              </label>

              <button
                type="button"
                className="text-sm font-bold text-fuchsia-300 transition hover:text-fuchsia-200"
              >
                שכחתי סיסמה
              </button>
            </div>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-violet-300"
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 text-left text-white outline-none transition placeholder:text-[#6F7892] focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
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

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#A8B0C7]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-violet-500"
            />
            זכור אותי
          </label>

          {errorMessage && (
            <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 px-6 text-base font-black text-white shadow-[0_14px_40px_rgba(139,92,246,0.4)] transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading
              ? "מתחבר..."
              : "התחברות"}
          </button>
          <div className="relative my-5">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-white/10" />
  </div>

  <div className="relative flex justify-center">
    <span className="bg-[#090A16] px-4 text-sm text-[#A8B0C7]">
      או
    </span>
  </div>
</div>

<button
  type="button"
  onClick={handleGoogleLogin}
  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 font-bold transition hover:bg-white/10"
>
  <svg
    width="22"
    height="22"
    viewBox="0 0 48 48"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.73 1.22 9.24 3.61l6.9-6.9C35.95 2.52 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.02 6.23C12.47 13.27 17.76 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.55c0-1.64-.15-3.22-.42-4.73H24v9h12.68c-.55 2.96-2.22 5.47-4.73 7.16l7.3 5.66C43.87 37.36 46.5 31.48 46.5 24.55z"
    />
    <path
      fill="#FBBC05"
      d="M10.58 28.55a14.5 14.5 0 010-9.1l-8.02-6.23A23.92 23.92 0 000 24c0 3.85.92 7.5 2.56 10.78l8.02-6.23z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.4 0 11.77-2.11 15.69-5.73l-7.3-5.66c-2.03 1.36-4.64 2.17-8.39 2.17-6.24 0-11.53-3.77-13.42-9.95l-8.02 6.23C6.51 42.62 14.62 48 24 48z"
    />
  </svg>

  המשך עם Google
</button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#A8B0C7]">
          <ShieldCheck
            size={15}
            className="text-cyan-300"
          />
          החיבור שלך מאובטח
        </div>

        <p className="mt-7 text-center text-sm text-[#A8B0C7]">
          עדיין אין לך חשבון?{" "}
          <Link
            href="/register"
            className="font-black text-fuchsia-300 transition hover:text-fuchsia-200"
          >
            פתיחת חשבון
          </Link>
        </p>
      </section>
    </main>
  );
}