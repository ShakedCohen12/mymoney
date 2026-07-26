"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import EmojiPicker from "@/components/categories/EmojiPicker";
import ColorPicker from "@/components/categories/ColorPicker";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type CreatedCategory = {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  user_id: string;
};

type AddCategoryModalProps = {
  open: boolean;
  initialType?: "expense" | "income";
  onClose: () => void;
  onCreated: (category: CreatedCategory) => void;
};

export default function AddCategoryModal({
  open,
  initialType = "expense",
  onClose,
  onCreated,
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">(initialType);
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#8B5CF6");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setType(initialType);
    }
  }, [open, initialType]);

  if (!open) return null;

  function clearForm() {
    setName("");
    setType(initialType);
    setIcon("📦");
    setColor("#8B5CF6");
    setError("");
  }

  function handleClose() {
    if (saving) return;

    clearForm();
    onClose();
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    const selectedIcon = icon.trim() || "📦";

    if (!trimmedName) {
      setError("כתבי שם לקטגוריה.");
      return;
    }

    setSaving(true);
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

      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: trimmedName,
          type,
          icon: selectedIcon,
          color,
        })
        .select("id, name, type, icon, color, user_id")
        .single();

      if (insertError || !data) {
        if (insertError?.code === "23505") {
          throw new Error("כבר קיימת אצלך קטגוריה בשם הזה.");
        }

        console.error("Create category error:", insertError);
        throw new Error("לא הצלחנו ליצור את הקטגוריה.");
      }

      onCreated(data as CreatedCategory);
      clearForm();
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו ליצור את הקטגוריה."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[30px] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-large)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--color-primary)]">
              קטגוריה אישית
            </p>

            <h2 className="mt-1 text-2xl font-bold text-[var(--color-text)]">
              הוספת קטגוריה
            </h2>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              תני לה כל שם וכל אימוג׳י שמתאים לך.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-xl text-[var(--color-text-secondary)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="סגירה"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <Input
            id="category-name"
            label="שם הקטגוריה"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="למשל: טיפוח, לימודים, חיית מחמד..."
            className="h-14 bg-[var(--color-background)]"
            disabled={saving}
          />
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold text-[var(--color-text)]">
            סוג הקטגוריה
          </p>

          <div className="mt-2 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--color-background)] p-1.5">
            <button
              type="button"
              onClick={() => setType("expense")}
              disabled={saving}
              className={`rounded-xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                type === "expense"
                  ? "bg-[var(--color-surface)] text-[var(--color-expense)] shadow-[var(--shadow-small)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              💸 הוצאה
            </button>

            <button
              type="button"
              onClick={() => setType("income")}
              disabled={saving}
              className={`rounded-xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                type === "income"
                  ? "bg-[var(--color-surface)] text-[var(--color-income)] shadow-[var(--shadow-small)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              💰 הכנסה
            </button>
          </div>
        </div>

        <div className="mt-6">
          <EmojiPicker value={icon} onChange={setIcon} />
        </div>

        <div className="mt-6">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="mt-6 rounded-2xl bg-[var(--color-background)] p-4">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
            תצוגה מקדימה
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${color}18` }}
            >
              {icon.trim() || "📦"}
            </div>

            <div>
              <p className="font-bold text-[var(--color-text)]">
                {name.trim() || "שם הקטגוריה"}
              </p>

              <p className="text-sm text-[var(--color-text-secondary)]">
                {type === "expense" ? "הוצאה" : "הכנסה"}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-expense)]"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={handleClose}
            disabled={saving}
            className="flex-1"
          >
            ביטול
          </Button>

          <Button
            type="button"
            fullWidth={false}
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="flex-1"
          >
            {saving ? "שומר..." : "שמירת קטגוריה"}
          </Button>
        </div>
      </div>
    </div>
  );
}