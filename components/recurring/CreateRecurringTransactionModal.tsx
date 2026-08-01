"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CalendarDays, RefreshCcw, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import CategorySelector from "@/components/transaction/CategorySelector";
import SubcategorySelector from "@/components/transaction/SubcategorySelector";
import TransactionTypeSwitch from "@/components/transaction/TransactionTypeSwitch";

type TransactionType = "income" | "expense";

type Frequency =
  | "weekly"
  | "monthly"
  | "bimonthly"
  | "yearly";

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
};

type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
};

type SubcategoryRow = {
  id: string;
  category_id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
};

const frequencyOptions: {
  value: Frequency;
  label: string;
  description: string;
}[] = [
  {
    value: "weekly",
    label: "כל שבוע",
    description: "פעם בשבוע",
  },
  {
    value: "monthly",
    label: "כל חודש",
    description: "באותו יום בכל חודש",
  },
  {
    value: "bimonthly",
    label: "כל חודשיים",
    description: "אחת לחודשיים",
  },
  {
    value: "yearly",
    label: "כל שנה",
    description: "באותו תאריך בכל שנה",
  },
];

function getTodayString() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function CreateRecurringTransactionModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] =
    useState<TransactionType>("expense");
  const [frequency, setFrequency] =
    useState<Frequency>("monthly");
  const [startDate, setStartDate] =
    useState(getTodayString());
  const [categoryId, setCategoryId] =
    useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] =
    useState<string | null>(null);
  const [note, setNote] = useState("");

  const [categories, setCategories] = useState<
    Category[]
  >([]);
  const [subcategories, setSubcategories] = useState<
    Subcategory[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === type
      ),
    [categories, type]
  );

  const visibleSubcategories = useMemo(() => {
    if (!categoryId) {
      return [];
    }

    return subcategories.filter(
      (subcategory) =>
        subcategory.categoryId === categoryId
    );
  }, [categoryId, subcategories]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadFormData() {
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

        const [
          {
            data: categoryData,
            error: categoryError,
          },
          {
            data: subcategoryData,
            error: subcategoryError,
          },
        ] = await Promise.all([
          supabase
            .from("categories")
            .select(
              "id, name, type, icon, color, user_id"
            )
            .or(
              `user_id.is.null,user_id.eq.${user.id}`
            )
            .order("name"),

          supabase
            .from("user_subcategories")
            .select("id, category_id, name")
            .eq("user_id", user.id)
            .order("name"),
        ]);

        if (categoryError) {
          throw new Error(
            "לא הצלחנו לטעון את הקטגוריות."
          );
        }

        if (subcategoryError) {
          throw new Error(
            "לא הצלחנו לטעון את תתי־הקטגוריות."
          );
        }

        if (cancelled) {
          return;
        }

        setCategories(
          (categoryData ?? []).map((category) => ({
            id: category.id,
            name: category.name,
            type: category.type as TransactionType,
            icon: category.icon || "📦",
            color: category.color || "#64748B",
          }))
        );

        setSubcategories(
          (
            (subcategoryData ?? []) as SubcategoryRow[]
          ).map((subcategory) => ({
            id: subcategory.id,
            categoryId: subcategory.category_id,
            name: subcategory.name,
          }))
        );
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "לא הצלחנו לטעון את הנתונים."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFormData();

    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setType("expense");
    setFrequency("monthly");
    setStartDate(getTodayString());
    setCategoryId(null);
    setSubcategoryId(null);
    setNote("");
    setError("");
  }

  function handleClose() {
    if (isSaving) {
      return;
    }

    resetForm();
    onClose();
  }

  function handleTypeChange(
    nextType: TransactionType
  ) {
    setType(nextType);
    setCategoryId(null);
    setSubcategoryId(null);
    setError("");
  }

  function handleCategorySelect(id: string) {
    setCategoryId(id);
    setSubcategoryId(null);
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);

    if (!title.trim()) {
      setError("כתבי שם לעסקה החוזרת.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("כתבי סכום גדול מ־0.");
      return;
    }

    if (!categoryId) {
      setError("בחרי קטגוריה.");
      return;
    }

    if (!startDate) {
      setError("בחרי תאריך התחלה.");
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

      const selectedCategory = categories.find(
        (category) => category.id === categoryId
      );

      if (
        !selectedCategory ||
        selectedCategory.type !== type
      ) {
        throw new Error(
          "הקטגוריה שנבחרה אינה תקינה."
        );
      }

      const { error: insertError } = await supabase
        .from("recurring_transactions")
        .insert({
          user_id: user.id,
          title: title.trim(),
          amount: numericAmount,
          type,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          frequency,
          start_date: startDate,
          next_due_date: startDate,
          status: "active",
          note: note.trim() || null,
        });

      if (insertError) {
        throw insertError;
      }

      resetForm();
      await onCreated();
      onClose();
    } catch (caughtError) {
      console.error(
        "Create recurring transaction error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו ליצור את העסקה החוזרת."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={handleClose}
    >
      <div
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl sm:max-w-2xl sm:rounded-[34px] sm:p-7"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="mb-7 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <RefreshCcw size={23} />
            </span>

            <div>
              <h2 className="text-2xl font-black text-[var(--color-text)]">
                עסקה חוזרת חדשה
              </h2>

              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                הגדירי תשלום או הכנסה שחוזרים באופן
                קבוע.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] transition hover:scale-105"
            aria-label="סגירה"
          >
            <X size={20} />
          </button>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-2xl bg-[var(--color-background)]"
              />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                שם העסקה
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="לדוגמה: שכר דירה"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                סכום
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">
                  ₪
                </span>

                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="0"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] py-4 pl-4 pr-11 text-left text-xl font-black text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
                  dir="ltr"
                />
              </div>
            </div>

            <TransactionTypeSwitch
              value={type}
              onChange={handleTypeChange}
            />

            <div>
              <p className="mb-3 text-sm font-bold text-[var(--color-text)]">
                תדירות
              </p>

              <div className="grid grid-cols-2 gap-3">
                {frequencyOptions.map((option) => {
                  const selected =
                    frequency === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFrequency(option.value)
                      }
                      className={`rounded-2xl border p-4 text-right transition ${
                        selected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                          : "border-[var(--color-border)] bg-[var(--color-background)]"
                      }`}
                    >
                      <p
                        className={`font-black ${
                          selected
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-text)]"
                        }`}
                      >
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                מועד ראשון
              </label>

              <div className="relative">
                <CalendarDays
                  size={19}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
                />

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] py-3.5 pl-4 pr-12 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                זה יהיה גם המועד הבא של העסקה.
              </p>
            </div>

            <CategorySelector
              categories={visibleCategories}
              selectedId={categoryId}
              onSelect={handleCategorySelect}
            />

            {categoryId && (
              <SubcategorySelector
                subcategories={visibleSubcategories}
                value={subcategoryId}
                onChange={(value) =>
                  setSubcategoryId(value || null)
                }
              />
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-text)]">
                הערה
                <span className="mr-1 font-normal text-[var(--color-text-secondary)]">
                  לא חובה
                </span>
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                rows={3}
                placeholder="פרטים נוספים על העסקה"
                className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
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
                onClick={handleClose}
                disabled={isSaving}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 font-bold text-[var(--color-text)]"
              >
                ביטול
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-[var(--color-primary)] px-4 py-4 font-bold text-white shadow-[var(--shadow-medium)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving
                  ? "שומרת..."
                  : "יצירת העסקה"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}