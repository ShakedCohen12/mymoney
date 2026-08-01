"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import EditGoalModal from "@/components/goals/EditGoalModal";

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
};

type GoalTransaction = {
  id: string;
  amount: number;
  type: "deposit" | "withdraw";
  note: string | null;
  created_at: string;
};

export default function GoalDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const goalId = params.id;
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] =
    useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadGoal = useCallback(async () => {
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

      const { data: goalData, error: goalError } = await supabase
        .from("saving_goals")
        .select(
          "id, title, target_amount, current_amount, target_date, icon, color"
        )
        .eq("id", goalId)
        .eq("user_id", user.id)
        .single();

      if (goalError) {
        throw goalError;
      }

      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("saving_goal_transactions")
          .select("id, amount, type, note, created_at")
          .eq("goal_id", goalId)
          .order("created_at", { ascending: false });

      if (transactionsError) {
        throw transactionsError;
      }

      setGoal(goalData as Goal);
      setTransactions((transactionsData ?? []) as GoalTransaction[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בטעינת היעד."
      );
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  function openTransactionModal(type: "deposit" | "withdraw") {
    setTransactionType(type);
    setAmount("");
    setNote("");
    setError("");
    setIsModalOpen(true);
  }

  async function handleTransaction(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!goal) return;

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      setError("צריך להזין סכום גדול מ־0.");
      return;
    }

    if (
      transactionType === "withdraw" &&
      parsedAmount > Number(goal.current_amount)
    ) {
      setError("אי אפשר למשוך יותר מהסכום שנחסך.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const newCurrentAmount =
        transactionType === "deposit"
          ? Number(goal.current_amount) + parsedAmount
          : Number(goal.current_amount) - parsedAmount;

      const { error: transactionError } = await supabase
        .from("saving_goal_transactions")
        .insert({
          goal_id: goal.id,
          amount: parsedAmount,
          type: transactionType,
          note: note.trim() || null,
        });

      if (transactionError) {
        throw transactionError;
      }

      const { error: updateError } = await supabase
        .from("saving_goals")
        .update({
          current_amount: newCurrentAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (updateError) {
        throw updateError;
      }

      setIsModalOpen(false);
      setAmount("");
      setNote("");

      await loadGoal();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת הפעולה."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteGoal() {
    if (!goal) return;

    const confirmed = window.confirm(
      `למחוק את היעד "${goal.title}"? הפעולה תמחק גם את היסטוריית ההפקדות.`
    );

    if (!confirmed) return;

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("saving_goals")
        .delete()
        .eq("id", goal.id);

      if (deleteError) {
        throw deleteError;
      }

      router.push("/goals");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה במחיקת היעד."
      );
    }
  }

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--color-background)] px-4 pb-28 pt-6"
      >
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="h-12 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
          <div className="h-80 animate-pulse rounded-[32px] bg-[var(--color-surface)]" />
        </div>
      </main>
    );
  }

  if (!goal) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--color-background)] px-4 pt-12"
      >
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-black text-[var(--color-text)]">
            היעד לא נמצא
          </h1>

          <Link
            href="/goals"
            className="mt-6 inline-block rounded-2xl bg-[var(--color-primary)] px-6 py-3 font-bold text-white"
          >
            חזרה ליעדים
          </Link>
        </div>
      </main>
    );
  }

  const targetAmount = Number(goal.target_amount);
  const currentAmount = Number(goal.current_amount);

  const percent =
    targetAmount > 0
      ? Math.min(100, (currentAmount / targetAmount) * 100)
      : 0;

  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--color-background)] px-4 pb-28 pt-6"
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/goals"
              className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]"
            >
              <ArrowRight size={20} />
              חזרה
            </Link>

<div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setIsEditModalOpen(true)}
    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] transition hover:scale-105"
    aria-label="עריכת היעד"
  >
    <Pencil size={18} />
  </button>

  <button
    type="button"
    onClick={handleDeleteGoal}
    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition hover:scale-105"
    aria-label="מחיקת היעד"
  >
    <Trash2 size={19} />
  </button>
</div>
          </div>

          <section
            className="overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
            style={{
              backgroundImage: `linear-gradient(145deg, ${goal.color}22, transparent 55%)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] text-4xl"
                style={{
                  backgroundColor: `${goal.color}25`,
                }}
              >
                {goal.icon}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-3xl font-black text-[var(--color-text)]">
                  {goal.title}
                </h1>

                {goal.target_date && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    תאריך יעד:{" "}
                    {new Date(goal.target_date).toLocaleDateString("he-IL")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p
                className="text-5xl font-black"
                style={{ color: goal.color }}
              >
                {percent.toFixed(0)}%
              </p>

              <p className="mt-3 text-lg font-bold text-[var(--color-text)]">
                ₪{currentAmount.toLocaleString("he-IL")}
                {" מתוך "}
                ₪{targetAmount.toLocaleString("he-IL")}
              </p>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                נותרו ₪{remainingAmount.toLocaleString("he-IL")}
              </p>
            </div>

            <div className="mt-7 h-4 overflow-hidden rounded-full bg-[var(--color-background)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percent}%`,
                  backgroundColor: goal.color,
                }}
              />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openTransactionModal("deposit")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-4 font-bold text-white transition hover:scale-[1.01]"
              >
                <Plus size={20} />
                הוסף כסף
              </button>

              <button
                type="button"
                onClick={() => openTransactionModal("withdraw")}
                disabled={currentAmount <= 0}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 font-bold text-[var(--color-text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={20} />
                משוך כסף
              </button>
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--color-text)]">
                היסטוריית פעולות
              </h2>

              <span className="text-sm text-[var(--color-text-secondary)]">
                {transactions.length} פעולות
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center">
                <p className="text-3xl">💰</p>

                <p className="mt-3 font-bold text-[var(--color-text)]">
                  עדיין אין פעולות
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  ההפקדות והמשיכות יופיעו כאן.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isDeposit = transaction.type === "deposit";

                  return (
                    <article
                      key={transaction.id}
                      className="flex items-center gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          isDeposit
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {isDeposit ? (
                          <Plus size={21} />
                        ) : (
                          <Minus size={21} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[var(--color-text)]">
                          {isDeposit ? "הפקדה ליעד" : "משיכה מהיעד"}
                        </p>

                        <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">
                          {transaction.note ||
                            new Date(
                              transaction.created_at
                            ).toLocaleDateString("he-IL")}
                        </p>
                      </div>

                      <p
                        className={`shrink-0 font-black ${
                          isDeposit ? "text-green-500" : "text-red-500"
                        }`}
                        dir="ltr"
                      >
                        {isDeposit ? "+" : "-"}₪
                        {Number(transaction.amount).toLocaleString("he-IL")}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {error && !isModalOpen && (
            <div className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
              {error}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            className="w-full rounded-t-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl sm:max-w-md sm:rounded-[32px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-[var(--color-text)]">
              {transactionType === "deposit"
                ? "הוספת כסף ליעד"
                : "משיכת כסף מהיעד"}
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {goal.icon} {goal.title}
            </p>

            <form onSubmit={handleTransaction} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                  סכום
                </label>

                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">
                    ₪
                  </span>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    autoFocus
                    placeholder="0"
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] py-4 pl-4 pr-10 text-left text-xl font-black text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                  הערה
                  <span className="mr-1 font-normal text-[var(--color-text-secondary)]">
                    לא חובה
                  </span>
                </label>

                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="לדוגמה: חיסכון מהמשכורת"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 font-bold text-[var(--color-text)]"
                >
                  ביטול
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[var(--color-primary)] px-4 py-4 font-bold text-white disabled:opacity-60"
                >
                  {isSaving
                    ? "שומרת..."
                    : transactionType === "deposit"
                      ? "הפקדה"
                      : "משיכה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {goal && (
  <EditGoalModal
    goal={goal}
    isOpen={isEditModalOpen}
    onClose={() => setIsEditModalOpen(false)}
    onUpdated={loadGoal}
  />
)}
    </>
  );
}