"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";

export default function RegisterSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleResendEmail() {
    if (!email) {
      setErrorMessage("לא נמצאה כתובת אימייל. נסה להירשם מחדש.");
      return;
    }

    setIsSending(true);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("מייל אימות חדש נשלח בהצלחה.");
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6 py-10"
    >
      <section className="w-full max-w-md rounded-[var(--radius-extra-large)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-large)]">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✉️
        </div>

        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          החשבון כמעט מוכן!
        </h1>

        <p className="mt-4 leading-7 text-[var(--color-text-secondary)]">
          שלחנו מייל אימות לכתובת:
        </p>

        {email && (
          <p
            className="mt-2 break-all font-bold text-[var(--color-primary)]"
            dir="ltr"
          >
            {email}
          </p>
        )}

        <div className="mt-6 rounded-[var(--radius-medium)] bg-green-50 p-4 text-right text-sm leading-6 text-green-800">
          <p className="font-semibold">מה צריך לעשות עכשיו?</p>

          <p className="mt-1">
            פתחי את המייל ולחצי על קישור אישור החשבון. לאחר האישור תוכלי
            להתחבר לאפליקציה.
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-[var(--color-text-secondary)]">
          לא מצאת את ההודעה? בדקי גם בתיקיות ספאם, קידומי מכירות או דואר
          זבל.
        </p>

        {errorMessage && (
          <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {message && (
          <p className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <div className="mt-7 space-y-3">
          <Button href="/login">כבר אישרתי — להתחברות</Button>

          <Button
            variant="secondary"
            onClick={handleResendEmail}
            disabled={isSending}
          >
            {isSending ? "שולח מחדש..." : "שליחת מייל אימות מחדש"}
          </Button>
        </div>

        <Link
          href="/register"
          className="mt-6 inline-block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        >
          השתמשתי בכתובת מייל שגויה
        </Link>
      </section>
    </main>
  );
}