//app/profile/appearance/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  type AccentColor,
  useAccent,
} from "@/components/providers/AccentProvider";
import { useTheme } from "next-themes";
import {
  Check,
  ChevronRight,
  Laptop,
  Moon,
  Palette,
  Sun,
} from "lucide-react";


const accentOptions: {
  id: AccentColor;
  name: string;
  color: string;
}[] = [
  { id: "purple", name: "סגול", color: "#7c3aed" },
  { id: "blue", name: "כחול", color: "#2563eb" },
  { id: "green", name: "ירוק", color: "#16a34a" },
  { id: "pink", name: "ורוד", color: "#db2777" },
  { id: "orange", name: "כתום", color: "#ea580c" },
];

const displayModes = [
  {
    id: "light",
    label: "בהיר",
    description: "תצוגה בהירה ונקייה",
    icon: Sun,
  },
  {
    id: "dark",
    label: "כהה",
    description: "נוח יותר בשעות הערב",
    icon: Moon,
  },
  {
    id: "system",
    label: "לפי המכשיר",
    description: "משתנה לפי הגדרת המכשיר",
    icon: Laptop,
  },
] as const;

export default function AppearancePage() {
 const { theme, setTheme } = useTheme();
const { accent, setAccent } = useAccent();
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

function handleAccentChange(newAccent: AccentColor) {
  setAccent(newAccent);
}
  if (!mounted) {
    return null;
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)] pb-40"
    >
      <div className="mx-auto w-full max-w-xl px-5 py-8">
        <header className="relative overflow-hidden rounded-[38px] bg-[var(--color-primary)] px-6 py-7 text-white shadow-xl">
          <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Palette size={24} strokeWidth={2.2} />
            </div>

            <h1 className="mt-5 text-3xl font-black">
              עיצוב האפליקציה
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
              בחרי את מצב התצוגה ואת הצבע שמתאים לך.
            </p>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-sm font-bold text-[var(--color-text-secondary)]">
            מצב תצוגה
          </h2>

          <div className="space-y-3">
            {displayModes.map((mode) => {
              const Icon = mode.icon;
              const selected = theme === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTheme(mode.id)}
                  className={`flex w-full items-center gap-4 rounded-[28px] border px-4 py-4 text-right shadow-sm transition active:scale-[0.985] ${
                    selected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      selected
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-background)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--color-text)]">
                      {mode.label}
                    </p>

                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {mode.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      selected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] text-transparent"
                    }`}
                  >
                    <Check size={17} strokeWidth={3} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-sm font-bold text-[var(--color-text-secondary)]">
            צבע ראשי
          </h2>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="grid grid-cols-5 gap-3">
              {accentOptions.map((option) => {
                const selected = accent === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleAccentChange(option.id)}
                    className="flex flex-col items-center gap-2"
                    aria-label={`בחירת צבע ${option.name}`}
                  >
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-full transition duration-200 ${
                        selected
                          ? "scale-110 ring-4 ring-[var(--color-background)] shadow-lg"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: option.color }}
                    >
                      {selected && (
                        <Check
                          size={24}
                          strokeWidth={3}
                          className="text-white"
                        />
                      )}
                    </span>

                    <span
                      className={`text-xs font-bold ${
                        selected
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {option.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-sm font-bold text-[var(--color-text-secondary)]">
            תצוגה מקדימה
          </h2>

          <div className="relative overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg">
            <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    היתרה שלך
                  </p>

                  <p className="mt-1 text-3xl font-black text-[var(--color-text)]">
                    ₪4,250
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  ₪
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[24px] bg-[var(--color-background)] p-4">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    הכנסות
                  </p>
                  <p className="mt-1 font-bold text-[var(--color-income)]">
                    ₪7,800
                  </p>
                </div>

                <div className="rounded-[24px] bg-[var(--color-background)] p-4">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    הוצאות
                  </p>
                  <p className="mt-1 font-bold text-[var(--color-expense)]">
                    ₪3,550
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 flex w-full items-center justify-between rounded-full bg-[var(--color-primary)] px-5 py-4 font-bold text-white shadow-lg transition active:scale-[0.985]"
              >
                <span>הוספת תנועה חדשה</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}