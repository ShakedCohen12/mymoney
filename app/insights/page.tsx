import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CircleAlert,
  PiggyBank,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  generateFinancialInsights,
  type FinancialInsight,
  type InsightTransaction,
} from "@/lib/insights";

function getInsightClasses(type: FinancialInsight["type"]) {
  if (type === "positive") {
    return {
      icon: "bg-emerald-500/10 text-emerald-500",
      value: "text-emerald-500",
    };
  }

  if (type === "negative") {
    return {
      icon: "bg-red-500/10 text-red-500",
      value: "text-red-500",
    };
  }

  if (type === "warning") {
    return {
      icon: "bg-amber-500/10 text-amber-500",
      value: "text-amber-500",
    };
  }

  return {
    icon: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    value: "text-[var(--color-primary)]",
  };
}

function getInsightIcon(id: string) {
  switch (id) {
    case "monthly-expense-change":
    case "weekly-expense-change":
      return TrendingUp;

    case "top-category":
    case "top-subcategory":
      return WalletCards;

    case "weekly-transactions":
    case "average-expense":
      return ReceiptText;

    case "largest-expense":
    case "small-expenses":
      return CircleAlert;

    case "savings-rate":
      return PiggyBank;

    case "monthly-balance":
      return TrendingDown;

    case "top-spending-day":
      return Sparkles;

    default:
      return Sparkles;
  }
}

function getRecommendation(insights: FinancialInsight[]) {
  const negativeInsight = insights.find(
    (insight) =>
      insight.type === "negative" || insight.type === "warning"
  );

  if (negativeInsight?.id === "monthly-expense-change") {
    return "כדאי לעבור על הקטגוריות שבהן ההוצאות עלו ולבחור קטגוריה אחת שבה אפשר לצמצם השבוע.";
  }

  if (negativeInsight?.id === "largest-expense") {
    return "יש לבדוק אם ההוצאה הגדולה ביותר היא הוצאה חד־פעמית או הוצאה שעשויה לחזור גם בחודשים הבאים.";
  }

  const topCategoryInsight = insights.find(
    (insight) => insight.id === "top-category"
  );

  if (topCategoryInsight) {
    return "הקטגוריה המובילה היא נקודת התחלה טובה להגדרת תקציב חודשי מדויק יותר.";
  }

  const savingsInsight = insights.find(
    (insight) => insight.id === "savings-rate"
  );

  if (savingsInsight?.type === "positive") {
    return "החודש את שומרת על מאזן חיובי. המשיכי לעקוב אחר ההוצאות כדי לשמור על קצב החיסכון.";
  }

  return "הוסיפי תנועות באופן שוטף כדי לקבל המלצות מדויקות ואישיות יותר.";
}

export default async function InsightsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("transactions")
.select(`
  amount,
  type,
  notes,
  transaction_date,
  categories (
    name
  ),
  user_subcategories (
    name
  )
`)
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Insights transactions error:", error);
  }

  const transactions = (data ?? []) as InsightTransaction[];

  const insights = generateFinancialInsights(transactions);

  const mainInsight = insights.find(
    (insight) =>
      insight.type === "negative" || insight.type === "warning"
  ) ?? insights[0];

  const recommendation = getRecommendation(insights);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)] pb-40"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:py-9">
        <header className="mb-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-text)] transition hover:scale-[1.02]"
          >
            <ArrowRight size={17} />
            חזרה
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg">
              <BrainCircuit size={23} strokeWidth={2.3} />
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--color-primary)]">
                MyMoney AI
              </p>

              <h1 className="text-2xl font-black text-[var(--color-text)] sm:text-3xl">
                התובנות שלך
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            ניתוח שמתעדכן לפי התנועות האמיתיות ששמרת בחשבון.
          </p>
        </header>

        {mainInsight ? (
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--color-primary)] to-purple-400 p-6 text-white shadow-lg sm:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-white/15 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                <Sparkles size={18} />
                תובנה מרכזית
              </div>

              <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
                {mainInsight.title}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
                {mainInsight.description}
              </p>

              <p className="mt-5 text-2xl font-black" dir="ltr">
                {mainInsight.value}
              </p>
            </div>
          </section>
        ) : (
          <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Sparkles size={25} />
            </div>

            <h2 className="mt-4 text-xl font-black text-[var(--color-text)]">
              עדיין אין מספיק נתונים
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              לאחר שתוסיפי תנועות, יופיעו כאן תובנות אישיות.
            </p>

            <Link
              href="/transactions/new"
              className="mt-5 inline-flex rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white"
            >
              הוספת תנועה
            </Link>
          </section>
        )}

        {insights.length > 0 && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.id);
              const classes = getInsightClasses(insight.type);

              return (
                <article
                  key={insight.id}
                  className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${classes.icon}`}
                    >
                      <Icon size={20} strokeWidth={2.3} />
                    </div>

                    <p
                      className={`text-xl font-black ${classes.value}`}
                      dir="ltr"
                    >
                      {insight.value}
                    </p>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-[var(--color-text)]">
                    {insight.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {insight.description}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        <section className="mt-6 rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <PiggyBank size={19} />
            </div>

            <h2 className="text-xl font-black text-[var(--color-text)]">
              המלצה להמשך
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
            {recommendation}
          </p>
        </section>
      </div>

    </main>
  );
}