// app/profile/page.tsx

"use client";

import AppleWalletConnection from "@/components/wallet/AppleWalletConnection";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Palette,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";

type SettingsItem = {
  title: string;
  subtitle: string;
  href: string;
  icon: typeof UserRound;
  iconClassName: string;
  danger?: boolean;
};

const settingsItems: SettingsItem[] = [
  {
    title: "הפרופיל שלי",
    subtitle: "שם, תמונה ופרטים אישיים",
    href: "/profile/account",
    icon: UserRound,
    iconClassName:
      "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white",
  },
  {
    title: "עיצוב האפליקציה",
    subtitle: "צבעים, מצב בהיר ומצב כהה",
    href: "/profile/appearance",
    icon: Palette,
    iconClassName:
      "bg-gradient-to-br from-indigo-500 to-violet-500 text-white",
  },
  {
    title: "יעדי חיסכון",
    subtitle: "יצירה ומעקב אחר המטרות שלך",
    href: "/goals",
    icon: Target,
    iconClassName:
      "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
  },
  {
    title: "ייצוא נתונים",
    subtitle: "הורדת הנתונים ל־Excel או PDF",
    href: "/export",
    icon: Download,
    iconClassName:
      "bg-gradient-to-br from-sky-500 to-blue-500 text-white",
  },
  {
    title: "מחיקת החשבון",
    subtitle: "מחיקה קבועה של החשבון והמידע",
    href: "/profile/delete-account",
    icon: Trash2,
    iconClassName: "bg-red-50 text-red-500",
    danger: true,
  },
];

export default function ProfilePage() {
  const router = useRouter();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)] pb-40"
    >
      <div className="mx-auto w-full max-w-xl px-5 py-8">
        <header className="relative overflow-hidden rounded-[38px] bg-[var(--color-primary)] px-6 py-7 text-white shadow-xl">
          <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-16 -right-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Palette size={24} strokeWidth={2.2} />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight">
              הגדרות
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
              כל מה שצריך כדי להתאים את MiSaldoAI בדיוק
              אלייך.
            </p>
          </div>
        </header>

        <section className="mt-7 space-y-3">
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => router.push(item.href)}
                className="group flex w-full items-center gap-4 rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-right shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.985]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-sm ${item.iconClassName}`}
                >
                  <Icon size={24} strokeWidth={2.2} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    className={`text-base font-bold ${
                      item.danger
                        ? "text-red-500"
                        : "text-[var(--color-text)]"
                    }`}
                  >
                    {item.title}
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
                    {item.subtitle}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] transition group-hover:-translate-x-1 group-hover:text-[var(--color-primary)]">
                  <ChevronLeft
                    size={20}
                    strokeWidth={2.2}
                  />
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-8">
          <AppleWalletConnection />
        </section>

        <p className="mt-9 text-center text-xs text-[var(--color-text-secondary)]">
          MiSaldoAI
        </p>
      </div>
    </main>
  );
}