"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import MyDatePicker from "@/components/transaction/DatePicker";
import AmountInput from "@/components/transaction/AmountInput";
import TransactionTypeSwitch from "@/components/transaction/TransactionTypeSwitch";
import CategorySelector from "@/components/transaction/CategorySelector";
import SubcategorySelector from "@/components/transaction/SubcategorySelector";
import { createClient } from "@/lib/supabase";

const categories = [
  {
    id: "food",
    name: "אוכל",
    icon: "🍔",
    color: "#8B5CF6",
    type: "expense",
  },
  {
    id: "transportation",
    name: "רכב ותחבורה",
    icon: "🚗",
    color: "#3B82F6",
    type: "expense",
  },
  {
    id: "shopping",
    name: "קניות",
    icon: "🛍️",
    color: "#EC4899",
    type: "expense",
  },
  {
    id: "bills",
    name: "חשבונות",
    icon: "🧾",
    color: "#F59E0B",
    type: "expense",
  },
  {
    id: "other-expense",
    name: "אחר",
    icon: "📦",
    color: "#64748B",
    type: "expense",
  },
  {
    id: "salary",
    name: "משכורת",
    icon: "💰",
    color: "#22C55E",
    type: "income",
  },
  {
    id: "extra-income",
    name: "הכנסה נוספת",
    icon: "💵",
    color: "#16A34A",
    type: "income",
  },
  {
    id: "other-income",
    name: "אחר",
    icon: "➕",
    color: "#15803D",
    type: "income",
  },
] as const;

const initialSubcategories = [
  {
    id: "food-1",
    categoryId: "food",
    name: "סופרמרקט",
  },
  {
    id: "food-2",
    categoryId: "food",
    name: "מסעדות",
  },
  {
    id: "food-3",
    categoryId: "food",
    name: "בתי קפה",
  },
  {
    id: "car-1",
    categoryId: "transportation",
    name: "דלק",
  },
  {
    id: "car-2",
    categoryId: "transportation",
    name: "ביטוח",
  },
  {
    id: "car-3",
    categoryId: "transportation",
    name: "טיפולים",
  },
  {
    id: "shopping-1",
    categoryId: "shopping",
    name: "בגדים",
  },
  {
    id: "shopping-2",
    categoryId: "shopping",
    name: "מוצרי בית",
  },
  {
    id: "bills-1",
    categoryId: "bills",
    name: "חשמל",
  },
  {
    id: "bills-2",
    categoryId: "bills",
    name: "מים",
  },
  {
    id: "bills-3",
    categoryId: "bills",
    name: "אינטרנט",
  },
];

type TransactionType = "expense" | "income";

type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
};

type CategoryRelation = {
  id: string;
  name: string;
  type: TransactionType;
};

type SubcategoryRelation = {
  id: string;
  name: string;
};

type TransactionRow = {
  id: string;
  amount: number | string;
  type: TransactionType;
  notes: string | null;
  transaction_date: string;
  category_id: string;
  subcategory_id: string | null;
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

  return Array.isArray(relation)
    ? relation[0] ?? null
    : relation;
}

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const transactionId = params.id;

  const [amount, setAmount] = useState("");
  const [type, setType] =
    useState<TransactionType>("expense");
  const [categoryId, setCategoryId] =
    useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] =
    useState<string | null>(null);

  const [subcategories, setSubcategories] =
    useState<Subcategory[]>(initialSubcategories);

  const [showAddSubcategory, setShowAddSubcategory] =
    useState(false);
  const [newSubcategoryName, setNewSubcategoryName] =
    useState("");

  const [transactionDate, setTransactionDate] =
    useState("");

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleCategories = useMemo(() => {
    return categories.filter(
      (category) => category.type === type
    );
  }, [type]);

  const visibleSubcategories = useMemo(() => {
    if (!categoryId) {
      return [];
    }

    return subcategories.filter(
      (subcategory) =>
        subcategory.categoryId === categoryId
    );
  }, [categoryId, subcategories]);

  const formIsValid =
    Number(amount) > 0 &&
    categoryId !== null &&
    transactionDate.length > 0;

  useEffect(() => {
    async function loadTransaction() {
      setLoading(true);
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

        const { data, error: transactionError } =
          await supabase
            .from("transactions")
            .select(`
              id,
              amount,
              type,
              notes,
              transaction_date,
              category_id,
              subcategory_id,
              categories (
                id,
                name,
                type
              ),
              user_subcategories (
                id,
                name
              )
            `)
            .eq("id", transactionId)
            .eq("user_id", user.id)
            .single();

        if (transactionError || !data) {
          console.error(
            "Load transaction error:",
            transactionError
          );

          throw new Error(
            "לא הצלחנו למצוא את התנועה."
          );
        }

        const transaction =
          data as unknown as TransactionRow;

        const databaseCategory = getSingleRelation(
          transaction.categories
        );

        const databaseSubcategory =
          getSingleRelation(
            transaction.user_subcategories
          );

        const localCategory = categories.find(
          (category) =>
            category.name === databaseCategory?.name &&
            category.type === transaction.type
        );

        if (!localCategory) {
          throw new Error(
            "לא הצלחנו לזהות את הקטגוריה של התנועה."
          );
        }

        let nextSubcategories = [
          ...initialSubcategories,
        ];

        let nextSubcategoryId: string | null = null;

        if (databaseSubcategory) {
          const existingLocalSubcategory =
            nextSubcategories.find(
              (subcategory) =>
                subcategory.categoryId ===
                  localCategory.id &&
                subcategory.name ===
                  databaseSubcategory.name
            );

          if (existingLocalSubcategory) {
            nextSubcategoryId =
              existingLocalSubcategory.id;
          } else {
            const loadedSubcategory: Subcategory = {
              id: databaseSubcategory.id,
              categoryId: localCategory.id,
              name: databaseSubcategory.name,
            };

            nextSubcategories = [
              ...nextSubcategories,
              loadedSubcategory,
            ];

            nextSubcategoryId =
              loadedSubcategory.id;
          }
        }

        setAmount(String(transaction.amount));
        setType(transaction.type);
        setCategoryId(localCategory.id);
        setSubcategories(nextSubcategories);
        setSubcategoryId(nextSubcategoryId);
        setTransactionDate(
          transaction.transaction_date
        );
        setNotes(transaction.notes ?? "");
      } catch (caughtError) {
        console.error(
          "Load transaction error:",
          caughtError
        );

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "לא הצלחנו לטעון את התנועה."
        );
      } finally {
        setLoading(false);
      }
    }

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  function handleTypeChange(
    nextType: TransactionType
  ) {
    setType(nextType);
    setCategoryId(null);
    setSubcategoryId(null);
    setShowAddSubcategory(false);
    setNewSubcategoryName("");
    setError("");
  }

  function handleCategorySelect(id: string) {
    setCategoryId(id);
    setSubcategoryId(null);
    setShowAddSubcategory(false);
    setNewSubcategoryName("");
    setError("");
  }

  function handleAddSubcategory() {
    const trimmedName =
      newSubcategoryName.trim();

    if (!categoryId) {
      setError("קודם צריך לבחור קטגוריה.");
      return;
    }

    if (!trimmedName) {
      setError("כתבי שם לתת־הקטגוריה.");
      return;
    }

    const alreadyExists = subcategories.some(
      (subcategory) =>
        subcategory.categoryId === categoryId &&
        subcategory.name
          .trim()
          .toLowerCase() ===
          trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      setError(
        "תת־הקטגוריה הזאת כבר קיימת."
      );
      return;
    }

    const newSubcategory: Subcategory = {
      id: crypto.randomUUID(),
      categoryId,
      name: trimmedName,
    };

    setSubcategories((current) => [
      ...current,
      newSubcategory,
    ]);

    setSubcategoryId(newSubcategory.id);
    setNewSubcategoryName("");
    setShowAddSubcategory(false);
    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!formIsValid) {
      setError(
        "מלאי סכום, קטגוריה ותאריך."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "לא נמצא משתמש מחובר."
        );
      }

      const selectedCategory = categories.find(
        (category) =>
          category.id === categoryId
      );

      if (!selectedCategory) {
        throw new Error(
          "הקטגוריה שנבחרה אינה תקינה."
        );
      }

      const {
        data: databaseCategory,
        error: categoryError,
      } = await supabase
        .from("categories")
        .select("id")
        .eq("name", selectedCategory.name)
        .eq("type", type)
        .single();

      if (categoryError || !databaseCategory) {
        console.error(
          "Category lookup error:",
          categoryError
        );

        throw new Error(
          `לא נמצאה הקטגוריה "${selectedCategory.name}".`
        );
      }

      let databaseSubcategoryId:
        | string
        | null = null;

      const selectedSubcategory =
        subcategories.find(
          (subcategory) =>
            subcategory.id === subcategoryId
        );

      if (selectedSubcategory) {
        const {
          data: existingSubcategory,
          error: subcategoryLookupError,
        } = await supabase
          .from("user_subcategories")
          .select("id")
          .eq("user_id", user.id)
          .eq(
            "category_id",
            databaseCategory.id
          )
          .eq(
            "name",
            selectedSubcategory.name
          )
          .maybeSingle();

        if (subcategoryLookupError) {
          console.error(
            "Subcategory lookup error:",
            subcategoryLookupError
          );

          throw new Error(
            "לא הצלחנו לבדוק את תת־הקטגוריה."
          );
        }

        if (existingSubcategory) {
          databaseSubcategoryId =
            existingSubcategory.id;
        } else {
          const {
            data: createdSubcategory,
            error: createSubcategoryError,
          } = await supabase
            .from("user_subcategories")
            .insert({
              user_id: user.id,
              category_id:
                databaseCategory.id,
              name: selectedSubcategory.name,
            })
            .select("id")
            .single();

          if (
            createSubcategoryError ||
            !createdSubcategory
          ) {
            console.error(
              "Create subcategory error:",
              createSubcategoryError
            );

            throw new Error(
              "לא הצלחנו לשמור את תת־הקטגוריה."
            );
          }

          databaseSubcategoryId =
            createdSubcategory.id;
        }
      }

      const { error: updateError } =
        await supabase
          .from("transactions")
          .update({
            type,
            amount: Number(amount),
            category_id:
              databaseCategory.id,
            subcategory_id:
              databaseSubcategoryId,
            notes: notes.trim() || null,
            transaction_date:
              transactionDate,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", transactionId)
          .eq("user_id", user.id);

      if (updateError) {
        console.error(
          "Update transaction error:",
          updateError
        );

        throw new Error(
          "לא הצלחנו לעדכן את התנועה."
        );
      }

      router.push("/transactions");
      router.refresh();
    } catch (caughtError) {
      console.error(
        "Update transaction error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו לעדכן את התנועה."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 px-5"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            טוען את התנועה...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto w-full max-w-xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              ניהול הכסף שלך
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-950">
              עריכת תנועה
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-slate-600 shadow-sm"
            aria-label="חזרה"
          >
            ←
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
        >
          <MyDatePicker
            value={transactionDate}
            onChange={setTransactionDate}
          />

          <AmountInput
            value={amount}
            onChange={setAmount}
          />

          <TransactionTypeSwitch
            value={type}
            onChange={handleTypeChange}
          />

          <CategorySelector
            categories={visibleCategories}
            selectedId={categoryId}
            onSelect={handleCategorySelect}
          />

          {categoryId && (
            <SubcategorySelector
              subcategories={
                visibleSubcategories
              }
              value={subcategoryId}
              onChange={setSubcategoryId}
              onAddNew={() => {
                setShowAddSubcategory(true);
                setError("");
              }}
            />
          )}

          {showAddSubcategory &&
            categoryId && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <label
                  htmlFor="new-subcategory"
                  className="text-sm font-semibold text-slate-700"
                >
                  שם תת־הקטגוריה החדשה
                </label>

                <input
                  id="new-subcategory"
                  type="text"
                  value={
                    newSubcategoryName
                  }
                  onChange={(event) =>
                    setNewSubcategoryName(
                      event.target.value
                    )
                  }
                  placeholder="לדוגמה: וטרינר"
                  className="mt-2 h-12 w-full rounded-xl border border-violet-200 bg-white px-4 outline-none focus:border-violet-500"
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubcategory(
                        false
                      );
                      setNewSubcategoryName("");
                      setError("");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500"
                  >
                    ביטול
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleAddSubcategory
                    }
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    הוספה
                  </button>
                </div>
              </div>
            )}

          <div className="space-y-2">
            <label
              htmlFor="transaction-notes"
              className="block text-sm font-semibold text-slate-700"
            >
              הערות
              <span className="mr-1 font-normal text-slate-400">
                (לא חובה)
              </span>
            </label>

            <textarea
              id="transaction-notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="אפשר להוסיף פרטים נוספים"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              !formIsValid || saving
            }
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-600 text-base font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {saving
              ? "מעדכן..."
              : "שמירת השינויים"}
          </button>
        </form>
      </div>
    </main>
  );
}