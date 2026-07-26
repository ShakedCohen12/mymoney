import { redirect } from "next/navigation";
import {
  ReceiptText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {
  generateFinancialInsights,
  type InsightTransaction,
} from "@/lib/insights";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import LogoutButton from "@/components/LogoutButton";
import AIInsightCard from "@/components/dashboard/AIInsightCard";
import BalanceCard from "@/components/dashboard/BalanceCard";
import WeeklyOverviewChart from "@/components/dashboard/WeeklyOverviewChart";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type TransactionRow = {
  id: string;
  amount: number | string;
  type: "expense" | "income";
  notes: string | null;
  transaction_date: string;
  categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  user_subcategories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function getRelatedName(
  relation:
    | { name: string }
    | { name: string }[]
    | null
    | undefined
) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation.name;
}

function parseTransactionDate(value: string) {
  const dateOnlyMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  return new Date(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
  }).format(parseTransactionDate(value));
}

function getTransactionIcon(
  type: "expense" | "income"
) {
  return type === "income" ? "↙" : "↗";
}

function isCurrentMonth(value: string) {
  const transactionDate = parseTransactionDate(value);
  const now = new Date();

  return (
    transactionDate.getFullYear() === now.getFullYear() &&
    transactionDate.getMonth() === now.getMonth()
  );
}

export default async function DashboardPage() {
  const supabase =
    await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
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
    .order("transaction_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Dashboard transactions error:",
      error
    );
  }

  const transactions =
    (data ?? []) as TransactionRow[];

  const dashboardInsights =
    generateFinancialInsights(
      transactions as InsightTransaction[]
    );

  const mainInsight =
    dashboardInsights.find(
      (insight) =>
        insight.type === "negative" ||
        insight.type === "warning"
    ) ??
    dashboardInsights[0] ??
    null;

  const income = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const expenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const balance = income - expenses;

  const currentMonthTransactions =
    transactions.filter((transaction) =>
      isCurrentMonth(
        transaction.transaction_date
      )
    );

  const currentMonthIncome =
    currentMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

  const currentMonthExpenses =
    currentMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

  const currentMonthBalance =
    currentMonthIncome - currentMonthExpenses;

  const savingsRate =
    currentMonthIncome > 0
      ? Math.max(
          Math.round(
            (currentMonthBalance /
              currentMonthIncome) *
              100
          ),
          0
        )
      : 0;

  const transactionCount =
    currentMonthTransactions.length;

  const recentTransactions =
    transactions.slice(0, 5);

  const fullName =
    typeof user.user_metadata.full_name ===
    "string"
      ? user.user_metadata.full_name
      : "משתמשת";

  const firstName =
    fullName.split(" ")[0] || "משתמשת";

  return (
    <main
      dir="rtl"
    className="min-h-screen bg-[var(--color-background)]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:py-9">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Sparkles
                  size={18}
                  strokeWidth={2.3}
                />
              </span>

              <p className="text-sm font-bold text-[var(--color-primary)]">
                יום נפלא, {firstName}
              </p>
            </div>

            <h1 className="mt-3 max-w-xl text-2xl font-black leading-tight tracking-tight text-[var(--color-text)] sm:text-3xl">
              הנה תמונת המצב של הכסף שלך
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              הכנסות, הוצאות ותובנות במקום
              אחד.
            </p>
          </div>

          <div className="shrink-0">
            <LogoutButton />
          </div>
        </header>

        <section>
          <BalanceCard
            balance={balance}
            income={income}
            expenses={expenses}
          />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          {/* צד שמאל: תובנת AI ותנועות אחרונות */}
          <div className="flex min-h-0 flex-col gap-6">
            <section>
              <AIInsightCard insight={mainInsight} />
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-[var(--color-text)]">
                  תנועות אחרונות
                </h2>

                <Button
                  href="/transactions"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                >
                  הצגת הכול
                </Button>
              </div>

              {recentTransactions.length === 0 ? (
                <Card
                  padding="none"
                  className="flex flex-1 overflow-hidden rounded-[30px] border border-[var(--color-border)]"
                >
                  <div className="flex w-full flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-2xl text-[var(--color-primary)]">
                      ₪
                    </div>

                    <p className="mt-4 font-bold text-[var(--color-text)]">
                      עדיין אין תנועות
                    </p>

                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      התנועה הראשונה שתשמרי תופיע כאן.
                    </p>

                    <div className="mt-5">
                      <Button href="/transactions/new" size="sm">
                        הוספת תנועה
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-1 flex-col gap-3">
                  {recentTransactions.map((transaction) => {
                    const isIncome =
                      transaction.type === "income";

                    const categoryName =
                      getRelatedName(transaction.categories) ??
                      "ללא קטגוריה";

                    const subcategoryName = getRelatedName(
                      transaction.user_subcategories
                    );

                    const transactionName =
                      subcategoryName ?? categoryName;

                    return (
                      <div
                        key={transaction.id}
                        className="flex flex-1 items-center gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:px-5"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                            isIncome
                              ? "bg-emerald-500/10 text-[var(--color-income)]"
                              : "bg-red-500/10 text-[var(--color-expense)]"
                          }`}
                        >
                          {getTransactionIcon(transaction.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-bold text-[var(--color-text)]">
                              {transactionName}
                            </p>

                            <span className="shrink-0 text-xs text-[var(--color-text-secondary)]">
                              {formatDate(
                                transaction.transaction_date
                              )}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">
                            {subcategoryName
                              ? categoryName
                              : transaction.notes || categoryName}
                          </p>
                        </div>

                        <p
                          className={`shrink-0 text-base font-black ${
                            isIncome
                              ? "text-[var(--color-income)]"
                              : "text-[var(--color-expense)]"
                          }`}
                          dir="ltr"
                        >
                          {isIncome ? "+" : "-"}
                          {Number(
                            transaction.amount
                          ).toLocaleString("he-IL")}{" "}
                          ₪
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* צד ימין: סיכום חודשי וגרף שבועי */}
          <div className="flex min-h-0 flex-col gap-6">
            <section>
              <div className="grid grid-cols-2 overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="flex items-center justify-center gap-3 px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <ReceiptText size={19} strokeWidth={2.3} />
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black leading-none text-[var(--color-text)]">
                      {transactionCount.toLocaleString("he-IL")}
                    </p>

                    <p className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      תנועות החודש
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 border-r border-[var(--color-border)] px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <TrendingUp size={19} strokeWidth={2.3} />
                  </div>

                  <div className="text-right">
                    <p
                      className="text-xl font-black leading-none text-[var(--color-text)]"
                      dir="ltr"
                    >
                      {savingsRate}%
                    </p>

                    <p className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      אחוז חיסכון
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="min-h-0 flex-1 [&>*]:h-full">
              <WeeklyOverviewChart
                transactions={transactions}
              />
            </section>
          </div>
        </div>
      </div>

    </main>
  );
}