import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import Button from "@/components/ui/Button";

const features = [
  {
    icon: ReceiptText,
    title: "מעקב אוטומטי",
    description: "כל ההכנסות וההוצאות במקום אחד",
  },
  {
    icon: Target,
    title: "יעדי חיסכון",
    description: "רואים בדיוק כמה התקדמת",
  },
  {
    icon: BarChart3,
    title: "ניתוח חכם",
    description: "מבינים לאן הכסף הולך",
  },
  {
    icon: BrainCircuit,
    title: "עוזר פיננסי",
    description: "תובנות חכמות שמותאמות אלייך",
  },
];

export default function Home() {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#090A16] text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full bg-violet-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/10 blur-[110px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:py-16">
        <section className="grid w-full items-center gap-14 lg:grid-cols-[1fr_1.08fr] lg:gap-20">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute inset-10 rounded-[40px] bg-gradient-to-br from-violet-600/25 via-fuchsia-500/20 to-sky-400/15 blur-3xl" />

              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-7">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#A8B0C7]">
                      תמונת מצב חודשית
                    </p>

                    <p className="mt-2 text-4xl font-black tracking-tight">
                      ₪8,420
                    </p>

                    <p className="mt-1 text-sm font-bold text-cyan-300">
                      +12% מהחודש הקודם
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_35px_rgba(139,92,246,0.45)]">
                    <BarChart3 size={27} />
                  </div>
                </div>

                <div className="mt-7 rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-[#A8B0C7]">
                        יעד חיסכון
                      </p>

                      <p className="mt-1 text-lg font-black">
                        חופשה ביפן ✈️
                      </p>
                    </div>

                    <p className="text-xl font-black text-fuchsia-300">
                      68%
                    </p>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_20px_rgba(236,72,153,0.4)]" />
                  </div>

                  <div className="mt-3 flex justify-between text-xs font-medium text-[#A8B0C7]">
                    <span>₪6,800 נחסכו</span>
                    <span>יעד: ₪10,000</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {features.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.title}
                        className="group rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.07]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-fuchsia-200 ring-1 ring-white/10">
                          <Icon size={20} />
                        </div>

                        <p className="mt-4 font-black">
                          {feature.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#A8B0C7]">
                          {feature.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-200 backdrop-blur">
              <Sparkles size={16} />
              ניהול פיננסי חכם, ברור ומדויק
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-2xl font-black text-white shadow-[0_12px_45px_rgba(139,92,246,0.45)]">
                MS
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  MiSaldoAI
                </h1>

                <p className="mt-1 text-sm text-[#A8B0C7]">
                  הכסף שלך, ברור יותר
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="max-w-2xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
                שליטה אמיתית
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                  בכסף שלך.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#A8B0C7] sm:text-lg">
                מנהלים הוצאות, הכנסות, תקציבים ויעדי
                חיסכון במקום אחד - עם סריקת חשבוניות,
                ניתוחים חכמים וחיבור לארנק הדיגיטלי לבנק
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:max-w-md sm:flex-row">
              <a
                href="/login"
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 px-6 text-base font-black text-white shadow-[0_14px_40px_rgba(139,92,246,0.4)] transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.985]"
              >
                התחברות
                <ArrowLeft size={18} />
              </a>

              <a
                href="/register"
                className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] px-6 text-base font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.09] active:scale-[0.985]"
              >
                פתיחת חשבון
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-[#A8B0C7]">
              <span className="flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className="text-cyan-300"
                />
                המידע שלך נשאר פרטי
              </span>

              <span className="flex items-center gap-2">
                <WalletCards
                  size={16}
                  className="text-fuchsia-300"
                />
                חיבור מאובטח
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}