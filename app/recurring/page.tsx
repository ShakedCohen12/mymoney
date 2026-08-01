"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CirclePause,
  CirclePlay,
  Plus,
  RefreshCcw,
  Square,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import CreateRecurringTransactionModal from "@/components/recurring/CreateRecurringTransactionModal";

type RecurringStatus = "active" | "paused" | "ended";
type TransactionType = "income" | "expense";
type Frequency = "weekly" | "monthly" | "bimonthly" | "yearly";

type RecurringTransaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  frequency: Frequency;
  start_date: string;
  next_due_date: string;
  status: RecurringStatus;
  note: string | null;
};

const frequencyLabels: Record<Frequency, string> = {
  weekly: "כל שבוע",
  monthly: "כל חודש",
  bimonthly: "כל חודשיים",
  yearly: "כל שנה",
};

const statusLabels: Record<RecurringStatus, string> = {
  active: "פעילה",
  paused: "מושהית",
  ended: "הסתיימה",
};

export default function RecurringTransactionsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] =
  useState(false);
  const [transactions, setTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRecurringTransactions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("לא נמצא משתמש מחובר.");
      }

      const { data, error: transactionsError } = await supabase
        .from("recurring_transactions")
        .select(
          `
          id,
          title,
          amount,
          type,
          frequency,
          start_date,
          next_due_date,
          status,
          note
        `
        )
        .eq("user_id", user.id)
        .order("next_due_date", { ascending: true });

      if (transactionsError) {
        throw transactionsError;
      }

      setTransactions(
        (data ?? []) as RecurringTransaction[]
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בטעינת העסקאות החוזרות."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecurringTransactions();
  }, [loadRecurringTransactions]);

  async function updateStatus(
    transaction: RecurringTransaction,
    newStatus: RecurringStatus
  ) {
    const actionText =
      newStatus === "paused"
        ? "להשהות"
        : newStatus === "active"
          ? "להפעיל מחדש"
          : "לסיים";

    if (newStatus === "ended") {
      const confirmed = window.confirm(
        `${actionText} את העסקה החוזרת "${transaction.title}"? לא ניתן יהיה להפעיל אותה מחדש מהמסך הרגיל.`
      );

      if (!confirmed) return;
    }

    setUpdatingId(transaction.id);
    setError("");

    try {
      const supabase = createClient();

      const updateData: {
        status: RecurringStatus;
        paused_at: string | null;
        ended_at: string | null;
        updated_at: string;
      } = {
        status: newStatus,
        paused_at:
          newStatus === "paused"
            ? new Date().toISOString()
            : null,
        ended_at:
          newStatus === "ended"
            ? new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("recurring_transactions")
        .update(updateData)
        .eq("id", transaction.id);

      if (updateError) {
        throw updateError;
      }

      setTransactions((current) =>
        current.map((item) =>
          item.id === transaction.id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בעדכון העסקה."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)] px-4 pb-28 pt-6"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--color-text)]">
              עסקאות חוזרות
            </h1>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              ניהול הכנסות והוצאות שקורות באופן קבוע
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white shadow-lg transition hover:scale-105"
          >
            <Plus size={19} />
            חדשה
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-[30px] bg-[var(--color-surface)]"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <RefreshCcw size={36} />
            </div>

            <h2 className="mt-5 text-xl font-black text-[var(--color-text)]">
              עדיין אין עסקאות חוזרות
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
              אפשר להוסיף משכורת, שכר דירה, מנויים, ביטוחים
              וכל תשלום שחוזר באופן קבוע.
            </p>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 py-3 font-bold text-white"
            >
              <Plus size={19} />
              יצירת עסקה חוזרת
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const isUpdating =
                updatingId === transaction.id;

              return (
                <article
                  key={transaction.id}
                  className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                        isIncome
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      <RefreshCcw size={25} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-[var(--color-text)]">
                            {transaction.title}
                          </h2>

                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {frequencyLabels[transaction.frequency]}
                          </p>
                        </div>

                        <p
                          className={`shrink-0 text-lg font-black ${
                            isIncome
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                          dir="ltr"
                        >
                          {isIncome ? "+" : "-"}₪
                          {Number(
                            transaction.amount
                          ).toLocaleString("he-IL")}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            transaction.status === "active"
                              ? "bg-green-500/10 text-green-500"
                              : transaction.status === "paused"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-slate-500/10 text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {statusLabels[transaction.status]}
                        </span>

                        {transaction.status !== "ended" && (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--color-background)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                            <CalendarDays size={13} />
                            הבא:{" "}
                            {new Date(
                              transaction.next_due_date
                            ).toLocaleDateString("he-IL")}
                          </span>
                        )}
                      </div>

                      {transaction.note && (
                        <p className="mt-3 truncate text-sm text-[var(--color-text-secondary)]">
                          {transaction.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {transaction.status !== "ended" && (
                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-4">
                      {transaction.status === "active" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              transaction,
                              "paused"
                            )
                          }
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 font-bold text-amber-500 transition active:scale-95 disabled:opacity-50"
                        >
                          <CirclePause size={19} />
                          {isUpdating
                            ? "מעדכן..."
                            : "השהיה"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              transaction,
                              "active"
                            )
                          }
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-green-500/10 px-4 py-3 font-bold text-green-500 transition active:scale-95 disabled:opacity-50"
                        >
                          <CirclePlay size={19} />
                          {isUpdating
                            ? "מעדכן..."
                            : "הפעלה מחדש"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            transaction,
                            "ended"
                          )
                        }
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 font-bold text-red-500 transition active:scale-95 disabled:opacity-50"
                      >
                        <Square size={17} />
                        סיום
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
      <CreateRecurringTransactionModal
  open={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onCreated={loadRecurringTransactions}
/>
    </main>
  );
}