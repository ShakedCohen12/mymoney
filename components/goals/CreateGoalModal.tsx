"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

type CreateGoalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const icons = ["🎯", "✈️", "🚗", "🏠", "🎓", "💍", "💻", "🐶", "🎁", "💰"];

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

export default function CreateGoalModal({
  isOpen,
  onClose,
  onCreated,
}: CreateGoalModalProps) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#8B5CF6");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function resetForm() {
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("");
    setTargetDate("");
    setIcon("🎯");
    setColor("#8B5CF6");
    setError("");
  }

  function handleClose() {
    if (isSaving) return;

    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const parsedTargetAmount = Number(targetAmount);
    const parsedCurrentAmount = currentAmount ? Number(currentAmount) : 0;

    if (!title.trim()) {
      setError("צריך להזין שם ליעד.");
      return;
    }

    if (!parsedTargetAmount || parsedTargetAmount <= 0) {
      setError("צריך להזין סכום יעד גדול מ־0.");
      return;
    }

    if (parsedCurrentAmount < 0) {
      setError("הסכום ההתחלתי לא יכול להיות שלילי.");
      return;
    }

    if (parsedCurrentAmount > parsedTargetAmount) {
      setError("הסכום ההתחלתי לא יכול להיות גבוה מסכום היעד.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("לא נמצא משתמש מחובר.");
      }

      const { error: insertError } = await supabase
        .from("saving_goals")
        .insert({
          user_id: user.id,
          title: title.trim(),
          target_amount: parsedTargetAmount,
          current_amount: parsedCurrentAmount,
          target_date: targetDate || null,
          icon,
          color,
        });

      if (insertError) {
        throw insertError;
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת היעד."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={handleClose}
    >
      <div
        dir="rtl"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl sm:max-w-lg sm:rounded-[32px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-[var(--color-text)]">
              יעד חיסכון חדש
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              מגדירים מטרה ומתחילים להתקדם אליה.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-background)] text-xl text-[var(--color-text-secondary)] transition hover:scale-105"
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
              placeholder="לדוגמה: טיול ליפן"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-[var(--color-text)]">
              אייקון
            </p>

            <div className="grid grid-cols-5 gap-3">
              {icons.map((item) => {
                const isSelected = icon === item;

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
                const isSelected = color === item;

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  min="1"
                  step="0.01"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  placeholder="20,000"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] py-3.5 pl-4 pr-10 text-left text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                כבר חסכתי
              </label>

              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">
                  ₪
                </span>

                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] py-3.5 pl-4 pr-10 text-left text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
                  dir="ltr"
                />
              </div>
            </div>
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
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
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
                  {title.trim() || "שם היעד שלך"}
                </p>

                <p className="text-sm text-[var(--color-text-secondary)]">
                  ₪
                  {Number(currentAmount || 0).toLocaleString("he-IL")}
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

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-2xl bg-[var(--color-primary)] px-5 py-4 font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "שומרת..." : "יצירת היעד"}
          </button>
        </form>
      </div>
    </div>
  );
}