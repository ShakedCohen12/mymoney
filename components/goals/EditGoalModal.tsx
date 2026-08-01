"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
};

type EditGoalModalProps = {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

const icons = [
  "🎯",
  "✈️",
  "🚗",
  "🏠",
  "🎓",
  "💍",
  "💻",
  "🐶",
  "🎁",
  "💰",
];

const colors = [
  "#8B5CF6",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#22C55E",
  "#F59E0B",
  "#F97316",
  "#EC4899",
];

export default function EditGoalModal({
  goal,
  isOpen,
  onClose,
  onUpdated,
}: EditGoalModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [targetAmount, setTargetAmount] = useState(
    String(goal.target_amount)
  );
  const [targetDate, setTargetDate] = useState(goal.target_date ?? "");
  const [icon, setIcon] = useState(goal.icon);
  const [color, setColor] = useState(goal.color);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setTitle(goal.title);
    setTargetAmount(String(goal.target_amount));
    setTargetDate(goal.target_date ?? "");
    setIcon(goal.icon);
    setColor(goal.color);
    setError("");
  }, [goal, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTargetAmount = Number(targetAmount);

    if (!title.trim()) {
      setError("צריך להזין שם ליעד.");
      return;
    }

    if (!parsedTargetAmount || parsedTargetAmount <= 0) {
      setError("סכום היעד חייב להיות גדול מ־0.");
      return;
    }

    if (parsedTargetAmount < Number(goal.current_amount)) {
      setError(
        `סכום היעד לא יכול להיות נמוך מהסכום שכבר נחסך: ₪${Number(
          goal.current_amount
        ).toLocaleString("he-IL")}.`
      );
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("saving_goals")
        .update({
          title: title.trim(),
          target_amount: parsedTargetAmount,
          target_date: targetDate || null,
          icon,
          color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (updateError) {
        throw updateError;
      }

      await onUpdated();
      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בעדכון היעד."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl sm:max-w-lg sm:rounded-[32px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-[var(--color-text)]">
              עריכת יעד
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              אפשר לשנות את פרטי היעד בלי לפגוע בהפקדות.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-background)] text-xl text-[var(--color-text-secondary)]"
            aria-label="סגירה"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
              שם היעד
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-[var(--color-text)]">
              אייקון
            </p>

            <div className="grid grid-cols-5 gap-3">
              {icons.map((item) => {
                const isSelected = item === icon;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIcon(item)}
                    className={`flex aspect-square items-center justify-center rounded-2xl border text-2xl transition ${
                      isSelected
                        ? "scale-105 border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                        : "border-[var(--color-border)] bg-[var(--color-background)] hover:scale-105"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-[var(--color-text)]">
              צבע
            </p>

            <div className="flex flex-wrap gap-3">
              {colors.map((item) => {
                const isSelected = item === color;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setColor(item)}
                    className={`h-10 w-10 rounded-full transition ${
                      isSelected
                        ? "scale-110 ring-4 ring-[var(--color-border)]"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: item }}
                    aria-label={`בחירת צבע ${item}`}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
              סכום היעד
            </label>

            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">
                ₪
              </span>

              <input
                type="number"
                inputMode="decimal"
                min={Number(goal.current_amount)}
                step="0.01"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] py-3.5 pl-4 pr-10 text-left text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                dir="ltr"
              />
            </div>

            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              כבר נחסכו ₪
              {Number(goal.current_amount).toLocaleString("he-IL")}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
              תאריך יעד
              <span className="mr-1 font-normal text-[var(--color-text-secondary)]">
                לא חובה
              </span>
            </label>

            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div
            className="rounded-3xl border border-[var(--color-border)] p-4"
            style={{
              background: `linear-gradient(135deg, ${color}20, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: `${color}25` }}
              >
                {icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[var(--color-text)]">
                  {title.trim() || "שם היעד"}
                </p>

                <p className="text-sm text-[var(--color-text-secondary)]">
                  ₪
                  {Number(goal.current_amount).toLocaleString("he-IL")}
                  {" מתוך "}
                  ₪
                  {Number(targetAmount || 0).toLocaleString("he-IL")}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
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
              {isSaving ? "שומרת..." : "שמירת שינויים"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}