import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import DeleteTransactionButton from "@/components/transaction/DeleteTransactionButton";

type CategoryRelation = {
  name: string;
  icon: string | null;
  color: string | null;
};

type SubcategoryRelation = {
  name: string;
};

type TransactionRow = {
  id: string;
  amount: number | string;
  type: "expense" | "income";
  notes: string | null;
  transaction_date: string;
  created_at: string;
  categories:
    | CategoryRelation
    | CategoryRelation[]
    | null;
  user_subcategories:
    | SubcategoryRelation
    | SubcategoryRelation[]
    | null;
};

function getSingleRelation<T>(
  relation: T | T[] | null
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function createLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(createLocalDate(date));
}

function getMonthKey(date: string) {
  const parsedDate = createLocalDate(date);

  return `${parsedDate.getFullYear()}-${String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthTitle(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(createLocalDate(date));
}

export default async function TransactionsPage() {
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
      id,
      amount,
      type,
      notes,
      transaction_date,
      created_at,
      categories (
        name,
        icon,
        color
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
    console.error("Transactions page error:", error);
  }

  const transactions = (data ?? []) as TransactionRow[];

  const groupedTransactions = transactions.reduce<
    Record<
      string,
      {
        title: string;
        transactions: TransactionRow[];
      }
    >
  >((groups, transaction) => {
    const monthKey = getMonthKey(
      transaction.transaction_date
    );

    if (!groups[monthKey]) {
      groups[monthKey] = {
        title: getMonthTitle(
          transaction.transaction_date
        ),
        transactions: [],
      };
    }

    groups[monthKey].transactions.push(transaction);

    return groups;
  }, {});

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)] pb-40"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-primary)]">
              כל התנועות
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              כל ההכנסות וההוצאות במקום אחד
            </p>
          </div>

          <Link
            href="/transactions/new"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-light text-white shadow-[var(--shadow-medium)] transition hover:scale-105"
            aria-label="הוספת תנועה"
          >
            +
          </Link>
        </header>

        {transactions.length === 0 ? (
         <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-[var(--shadow-small)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-4xl">
              💸
            </div>

            <h2 className="mt-5 text-xl font-bold text-[var(--color-text)]">
              עדיין אין תנועות
            </h2>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              הוסיפי הכנסה או הוצאה ראשונה כדי להתחיל
            </p>

            <Link
              href="/transactions/new"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-6 font-semibold text-white"
            >
              הוספת תנועה
            </Link>
          </section>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTransactions).map(
              ([monthKey, monthGroup]) => (
                <section key={monthKey}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-bold text-[var(--color-text)]">
                      {monthGroup.title}
                    </h2>

                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {monthGroup.transactions.length} תנועות
                    </span>
                  </div>

                  <div className="space-y-3">
                    {monthGroup.transactions.map(
                      (transaction) => {
                        const category =
                          getSingleRelation(
                            transaction.categories
                          );

                        const subcategory =
                          getSingleRelation(
                            transaction.user_subcategories
                          );

                        const isIncome =
                          transaction.type === "income";

                        const categoryName =
                          category?.name ??
                          (isIncome
                            ? "הכנסה"
                            : "ללא קטגוריה");

                        const transactionName =
                          subcategory?.name ??
                          categoryName;

                        const amount = Number(
                          transaction.amount
                        );

                        const fallbackIcon = isIncome
                          ? "💰"
                          : "💳";

                        const icon =
                          category?.icon?.trim() ||
                          fallbackIcon;

                        const categoryColor =
                          category?.color || "#8B5CF6";

                        return (
                          <article
                            key={transaction.id}
                            className="group rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-small)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-medium)]"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
                                style={{
                                  backgroundColor: `${categoryColor}18`,
                                }}
                              >
                                {icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-[var(--color-text)]">
                                  {transactionName}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                                  <span>{categoryName}</span>

                                  <span>•</span>

                                  <span>
                                    {formatDate(
                                      transaction.transaction_date
                                    )}
                                  </span>
                                </div>

                                {transaction.notes && (
                                  <p className="mt-2 truncate text-xs leading-5 text-[var(--color-text-secondary)]">
                                    {transaction.notes}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <p
                                  dir="ltr"
                                  className={
                                    isIncome
                                      ? "text-base font-bold text-emerald-600"
                                      : "text-base font-bold text-red-500"
                                  }
                                >
                                  {isIncome ? "+" : "-"}
                                  {amount.toLocaleString(
                                    "he-IL"
                                  )}{" "}
                                  ₪
                                </p>

<div className="flex items-center gap-1">
<Link
  href={`/transactions/${transaction.id}/edit`}
  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
  aria-label="עריכת תנועה"
  title="עריכת תנועה"
>
  ✏️
</Link>

  <DeleteTransactionButton
    transactionId={transaction.id}
    transactionName={transactionName}
    transactionAmount={amount}
    transactionType={transaction.type}
  />
</div>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </div>

    </main>
  );
}