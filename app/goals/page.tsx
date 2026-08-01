"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import Link from "next/link";

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState("");

  const loadGoals = useCallback(async () => {
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

      const { data, error: goalsError } = await supabase
        .from("saving_goals")
        .select(
          "id, title, target_amount, current_amount, target_date, icon, color"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) {
        throw goalsError;
      }

      setGoals((data ?? []) as Goal[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בטעינת היעדים."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--color-background)] px-4 pb-28 pt-6"
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-[var(--color-text)]">
                יעדי חיסכון
              </h1>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                החלומות שלך, במסלול הנכון.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="shrink-0 rounded-2xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white shadow-lg transition hover:scale-105"
            >
              + יעד חדש
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
                  className="h-40 animate-pulse rounded-3xl bg-[var(--color-surface)]"
                />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-primary-light)] text-4xl">
                🎯
              </div>

              <h2 className="text-xl font-black text-[var(--color-text)]">
                עדיין אין לך יעד
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
                צרי את יעד החיסכון הראשון שלך והתחילי לראות את ההתקדמות.
              </p>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 rounded-2xl bg-[var(--color-primary)] px-6 py-3 font-bold text-white"
              >
                יצירת יעד ראשון
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {goals.map((goal) => {
                const targetAmount = Number(goal.target_amount);
                const currentAmount = Number(goal.current_amount);

                const percent =
                  targetAmount > 0
                    ? Math.min(100, (currentAmount / targetAmount) * 100)
                    : 0;

                const remainingAmount = Math.max(
                  0,
                  targetAmount - currentAmount
                );

                return (
<Link
  key={goal.id}
  href={`/goals/${goal.id}`}
  className="block rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
>
                    <div className="mb-5 flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-3xl"
                        style={{
                          backgroundColor: `${goal.color}22`,
                        }}
                      >
                        {goal.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-black text-[var(--color-text)]">
                          {goal.title}
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          ₪{currentAmount.toLocaleString("he-IL")}
                          {" מתוך "}
                          ₪{targetAmount.toLocaleString("he-IL")}
                        </p>
                      </div>

                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black"
                        style={{
                          backgroundColor: `${goal.color}20`,
                          color: goal.color,
                        }}
                      >
                        {percent.toFixed(0)}%
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-[var(--color-background)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[var(--color-text-secondary)]">
                        נותרו ₪{remainingAmount.toLocaleString("he-IL")}
                      </span>

                      {goal.target_date && (
                        <span className="text-[var(--color-text-secondary)]">
                          עד{" "}
                          {new Date(goal.target_date).toLocaleDateString(
                            "he-IL"
                          )}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadGoals}
      />
    </>
  );
}