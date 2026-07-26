import SpendingChart from "@/components/dashboard/SpendingChart";
import CategoryPieChart from "@/components/analytics/CategoryPieChart";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type ChartTransaction = {
  amount: number | string;
  type: "income" | "expense";
  category_id: string | null;
  transaction_date: string;
};

type CategoryRow = {
  id: string;
  name: string;
  color: string;
};

const moneyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const firstDayOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );


  const toDateString = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

  const monthStart = toDateString(firstDayOfMonth);
  const nextMonthStart = toDateString(firstDayOfNextMonth);

  const { data: transactionData, error: transactionsError } =
    await supabase
      .from("transactions")
      .select(
        "amount, type, category_id, transaction_date"
      )
      .eq("user_id", user.id)
      .order("transaction_date", {
        ascending: true,
      });

  if (transactionsError) {
    console.error(
      "Analytics transactions error:",
      transactionsError
    );
  }

  const transactions =
    (transactionData ?? []) as ChartTransaction[];

  const currentMonthTransactions = transactions.filter(
    (transaction) =>
      transaction.transaction_date >= monthStart &&
      transaction.transaction_date < nextMonthStart
  );

  const currentMonthExpenses =
    currentMonthTransactions.filter(
      (transaction) => transaction.type === "expense"
    );

  const currentMonthIncome =
    currentMonthTransactions.filter(
      (transaction) => transaction.type === "income"
    );


  const totalExpenses = currentMonthExpenses.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const totalIncome = currentMonthIncome.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const netSavings = totalIncome - totalExpenses;

  const categoryIds = [
    ...new Set(
      currentMonthExpenses
        .map((transaction) => transaction.category_id)
        .filter(
          (categoryId): categoryId is string =>
            categoryId !== null
        )
    ),
  ];

  let categories: CategoryRow[] = [];

  if (categoryIds.length > 0) {
    const { data: categoryRows, error: categoriesError } =
      await supabase
        .from("categories")
        .select("id, name, color")
        .in("id", categoryIds);

    if (categoriesError) {
      console.error(
        "Analytics categories error:",
        categoriesError
      );
    }

    categories = (categoryRows ?? []) as CategoryRow[];
  }

  const categoryData = categories
    .map((category) => {
      const value = currentMonthExpenses
        .filter(
          (transaction) =>
            transaction.category_id === category.id
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0
        );

      return {
        name: category.name,
        value,
        color: category.color,
      };
    })
    .filter((category) => category.value > 0)
    .sort((a, b) => b.value - a.value);


  const summaryCards = [
    {
      label: "הכנסות החודש",
      value: formatMoney(totalIncome),
      icon: "↗",
      description: "כל ההכנסות שנרשמו",
    },
    {
      label: "הוצאות החודש",
      value: formatMoney(totalExpenses),
      icon: "↘",
      description: "כל ההוצאות שנרשמו",
    },
    {
      label: "מאזן חודשי",
      value: formatMoney(netSavings),
      icon: netSavings >= 0 ? "＋" : "−",
      description:
        netSavings >= 0
          ? "נשאר לך יותר ממה שהוצאת"
          : "הוצאת יותר ממה שהכנסת",
    },
    {
      label: "מספר תנועות",
      value: currentMonthTransactions.length.toLocaleString(
        "he-IL"
      ),
      icon: "≡",
      description: "הכנסות והוצאות החודש",
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <header className="mb-7">
          <h1 className="text-3xl font-black text-[var(--color-primary)]">
            ניתוח פיננסי
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            ניתוח ההכנסות, ההוצאות והמגמות שלך
          </p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-small)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                    {card.label}
                  </p>

                  <p className="mt-2 text-xl font-black text-[var(--color-text)]">
                    {card.value}
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-lg font-black text-[var(--color-primary)]">
                  {card.icon}
                </span>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mb-6">
          <SpendingChart transactions={transactions} />
        </section>

        <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-small)]">
          <div className="mb-5">
            <h2 className="text-lg font-black text-[var(--color-primary)]">
              כך התחלקו ההוצאות שלך החודש
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              חלוקה לפי הקטגוריות שבהן השתמשת
            </p>
          </div>

          <CategoryPieChart categoryData={categoryData} />
        </section>
      </div>
    </main>
  );
}