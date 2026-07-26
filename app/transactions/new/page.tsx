"use client";

import {
  matchMerchant,
  normalizeMerchant,
} from "@/lib/merchantMatcher";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MyDatePicker from "@/components/transaction/DatePicker";
import AmountInput from "@/components/transaction/AmountInput";
import TransactionTypeSwitch from "@/components/transaction/TransactionTypeSwitch";
import CategorySelector from "@/components/transaction/CategorySelector";
import SubcategorySelector from "@/components/transaction/SubcategorySelector";
import { createClient } from "@/lib/supabase";
import AddCategoryModal, {
  CreatedCategory,
} from "@/components/categories/AddCategoryModal";
import ReceiptScanner from "@/components/transaction/ReceiptScanner";

type TransactionType = "expense" | "income";

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  user_id?: string | null;
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

type MerchantRuleRow = {
  id: string;
  merchant_key: string;
  merchant_name: string;
  category_id: string;
  subcategory_id: string | null;
};

export default function NewTransactionPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
const [detectedMerchant, setDetectedMerchant] =
  useState("");

const [learnedMerchantRules, setLearnedMerchantRules] =
  useState<MerchantRuleRow[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategoriesAndSubcategories() {
      setLoadingCategories(true);
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
  { data: categoryData, error: categoryError },
  { data: subcategoryData, error: subcategoryError },
  { data: merchantRuleData, error: merchantRuleError },
] = await Promise.all([
  supabase
    .from("categories")
    .select("id, name, type, icon, color, user_id")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name"),

  supabase
    .from("user_subcategories")
    .select("id, category_id, name")
    .eq("user_id", user.id)
    .order("name"),

  supabase
    .from("merchant_rules")
    .select(
      "id, merchant_key, merchant_name, category_id, subcategory_id"
    )
    .eq("user_id", user.id),
]);

        if (categoryError) {
          console.error("Load categories error:", categoryError);
          throw new Error("לא הצלחנו לטעון את הקטגוריות.");
        }

        if (subcategoryError) {
          console.error("Load subcategories error:", subcategoryError);
          throw new Error("לא הצלחנו לטעון את תתי־הקטגוריות.");
        }
        if (merchantRuleError) {
  console.error(
    "Load merchant rules error:",
    merchantRuleError
  );

  throw new Error(
    "לא הצלחנו לטעון את כללי בתי העסק."
  );
}
        if (cancelled) {
          return;
        }

        const normalizedCategories: Category[] = (categoryData ?? []).map(
          (category) => ({
            id: category.id,
            name: category.name,
            type: category.type as TransactionType,
            icon: category.icon || "📦",
            color: category.color || "#64748B",
            user_id: category.user_id,
          })
        );

        const normalizedSubcategories: Subcategory[] = (
          (subcategoryData ?? []) as SubcategoryRow[]
        ).map((subcategory) => ({
          id: subcategory.id,
          categoryId: subcategory.category_id,
          name: subcategory.name,
        }));

        setCategories(normalizedCategories);
        setSubcategories(normalizedSubcategories);
        setLearnedMerchantRules(
  (merchantRuleData ?? []) as MerchantRuleRow[]
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
          setLoadingCategories(false);
        }
      }
    }

    void loadCategoriesAndSubcategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const visibleSubcategories = useMemo(() => {
    if (!categoryId) {
      return [];
    }

    return subcategories.filter(
      (subcategory) => subcategory.categoryId === categoryId
    );
  }, [categoryId, subcategories]);

  const formIsValid =
    Number(amount) > 0 &&
    categoryId !== null &&
    transactionDate.length > 0 &&
    !loadingCategories;

  function handleTypeChange(nextType: TransactionType) {
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

function normalizeCategoryName(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/[״"'׳`]/g, "")
    .replace(/[^a-z0-9א-ת]/g, "")
    .trim();
}

function findCategoryByNames(names: string[]) {
  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const normalizedNames = names.map(normalizeCategoryName);

  const exactMatch = expenseCategories.find((category) => {
    const normalizedCategory = normalizeCategoryName(category.name);

    return normalizedNames.some(
      (name) => normalizedCategory === name
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  return expenseCategories.find((category) => {
    const normalizedCategory = normalizeCategoryName(category.name);

    return normalizedNames.some(
      (name) =>
        normalizedCategory.includes(name) ||
        name.includes(normalizedCategory)
    );
  });
}

function findSubcategoryByNames(
  selectedCategoryId: string,
  names: string[]
) {
  const normalizedNames = names.map(
    normalizeCategoryName
  );

  return subcategories.find((subcategory) => {
    if (
      subcategory.categoryId !== selectedCategoryId
    ) {
      return false;
    }

    const subcategoryName = normalizeCategoryName(
      subcategory.name
    );

    return normalizedNames.some(
      (name) =>
        subcategoryName === name ||
        subcategoryName.includes(name) ||
        name.includes(subcategoryName)
    );
  });
}

function handleMerchantDetected(merchant: string) {
  const trimmedMerchant = merchant.trim();

  console.log("🏪 OCR merchant:", trimmedMerchant);
  console.log(
    "📂 Available expense categories:",
    categories
      .filter((category) => category.type === "expense")
      .map((category) => ({
        id: category.id,
        name: category.name,
      }))
  );

  if (!trimmedMerchant) {
    console.log("❌ No merchant was detected");
    return;
  }

  setDetectedMerchant(trimmedMerchant);

  setNotes((current) => {
    if (!current.trim()) {
      return trimmedMerchant;
    }

    if (
      normalizeMerchant(current).includes(
        normalizeMerchant(trimmedMerchant)
      )
    ) {
      return current;
    }

    return `${trimmedMerchant}\n${current}`;
  });

  const merchantKey = normalizeMerchant(trimmedMerchant);

  const learnedRule = learnedMerchantRules.find(
    (rule) => rule.merchant_key === merchantKey
  );

  if (learnedRule) {
    console.log("🧠 Learned merchant rule found:", learnedRule);

    const learnedCategory = categories.find(
      (category) =>
        category.id === learnedRule.category_id &&
        category.type === "expense"
    );

    if (learnedCategory) {
      console.log(
        "✅ Selecting learned category:",
        learnedCategory.name
      );

      setType("expense");
      setCategoryId(learnedCategory.id);

      const learnedSubcategory = learnedRule.subcategory_id
        ? subcategories.find(
            (subcategory) =>
              subcategory.id === learnedRule.subcategory_id &&
              subcategory.categoryId === learnedCategory.id
          )
        : undefined;

      setSubcategoryId(learnedSubcategory?.id ?? null);
      return;
    }

    console.log(
      "❌ Learned category ID does not exist in loaded categories"
    );
  }

  const builtInMatch = matchMerchant(trimmedMerchant);

  console.log("🔍 Built-in match:", builtInMatch);

  if (!builtInMatch) {
    console.log(
      "❌ Merchant does not exist in merchantMatcher.ts"
    );
    return;
  }

  const matchedCategory = findCategoryByNames(
    builtInMatch.categoryNames
  );

  console.log(
    "📂 Matched category:",
    matchedCategory ?? "No category match"
  );

  if (!matchedCategory) {
    console.log(
      "❌ Merchant matched, but none of these category names exist:",
      builtInMatch.categoryNames
    );
    return;
  }

  setType("expense");
  setCategoryId(matchedCategory.id);

  const matchedSubcategory = findSubcategoryByNames(
    matchedCategory.id,
    builtInMatch.subcategoryNames
  );

  setSubcategoryId(matchedSubcategory?.id ?? null);

  console.log("✅ Category selected:", matchedCategory.name);
  console.log(
    "✅ Subcategory selected:",
    matchedSubcategory?.name ?? "No matching subcategory"
  );
}

  async function handleAddSubcategory() {
    const trimmedName = newSubcategoryName.trim();

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
        subcategory.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      setError("תת־הקטגוריה הזאת כבר קיימת.");
      return;
    }

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
        .from("user_subcategories")
        .insert({
          user_id: user.id,
          category_id: categoryId,
          name: trimmedName,
        })
        .select("id, category_id, name")
        .single();

      if (insertError || !data) {
        if (insertError?.code === "23505") {
          throw new Error("תת־הקטגוריה הזאת כבר קיימת.");
        }

        console.error("Create subcategory error:", insertError);
        throw new Error("לא הצלחנו לשמור את תת־הקטגוריה.");
      }

      const newSubcategory: Subcategory = {
        id: data.id,
        categoryId: data.category_id,
        name: data.name,
      };

      setSubcategories((current) => [...current, newSubcategory]);
      setSubcategoryId(newSubcategory.id);
      setNewSubcategoryName("");
      setShowAddSubcategory(false);
      setError("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו לשמור את תת־הקטגוריה."
      );
    }
  }

  function handleCategoryCreated(category: CreatedCategory) {
    const normalizedCategory: Category = {
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon || "📦",
      color: category.color || "#64748B",
      user_id: category.user_id,
    };

    setCategories((current) =>
      [...current, normalizedCategory].sort((a, b) =>
        a.name.localeCompare(b.name, "he")
      )
    );

    setType(category.type);
    setCategoryId(category.id);
    setSubcategoryId(null);
    setShowAddCategory(false);
    setShowAddSubcategory(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!formIsValid || !categoryId) {
      setError("מלאי סכום, קטגוריה ותאריך.");
      return;
    }

    const selectedCategory = categories.find(
      (category) => category.id === categoryId
    );

    if (!selectedCategory || selectedCategory.type !== type) {
      setError("הקטגוריה שנבחרה אינה תקינה.");
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
        throw new Error("לא נמצא משתמש מחובר.");
      }

      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type,
          amount: Number(amount),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          notes: notes.trim() || null,
          transaction_date: transactionDate,
        });

      if (transactionError) {
        console.error("Transaction insert error:", transactionError);
        throw new Error("לא הצלחנו לשמור את התנועה.");
      }
      if (detectedMerchant && categoryId) {
  const merchantKey =
    normalizeMerchant(detectedMerchant);

  const { data: savedRule, error: ruleError } =
    await supabase
      .from("merchant_rules")
      .upsert(
        {
          user_id: user.id,
          merchant_key: merchantKey,
          merchant_name: detectedMerchant,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,merchant_key",
        }
      )
      .select(
        "id, merchant_key, merchant_name, category_id, subcategory_id"
      )
      .single();

  if (ruleError) {
    console.error(
      "Save merchant rule error:",
      ruleError
    );
  } else if (savedRule) {
    setLearnedMerchantRules((current) => {
      const withoutOldRule = current.filter(
        (rule) =>
          rule.merchant_key !==
          savedRule.merchant_key
      );

      return [
        ...withoutOldRule,
        savedRule as MerchantRuleRow,
      ];
    });
  }
}
      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      console.error("Save transaction error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו לשמור את התנועה."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
<main
  dir="rtl"
  className="min-h-screen bg-[var(--color-background)]"
>
  <div className="mx-auto w-full max-w-2xl px-5 py-8">
          <header className="mb-7 flex items-start justify-between gap-4">
  <div>
    <p className="text-sm font-bold text-[var(--color-primary)]">
      ניהול הכסף שלך
    </p>

    <h1 className="mt-1 text-3xl font-black text-[var(--color-text)]">
      הוספת תנועה
    </h1>

    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
      אפשר למלא ידנית או לסרוק חשבונית
    </p>
  </div>

  <button
    type="button"
    onClick={() => router.back()}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl text-[var(--color-text)] shadow-[var(--shadow-small)] transition hover:bg-[var(--color-primary-light)]"
    aria-label="חזרה"
  >
    ←
  </button>
</header>

<form
  onSubmit={handleSubmit}
  className="space-y-7 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-medium)] sm:p-7"
>
<ReceiptScanner
  onAmountDetected={setAmount}
  onDateDetected={setTransactionDate}
  onMerchantDetected={handleMerchantDetected}
/>
            <MyDatePicker
              value={transactionDate}
              onChange={setTransactionDate}
            />

            <AmountInput value={amount} onChange={setAmount} />

            <TransactionTypeSwitch
              value={type}
              onChange={handleTypeChange}
            />

            {loadingCategories ? (
             <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 text-center text-sm font-medium text-[var(--color-text-secondary)]">
                טוען קטגוריות...
              </div>
            ) : (
              <>
                <CategorySelector
                  categories={visibleCategories}
                  selectedId={categoryId}
                  onSelect={handleCategorySelect}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(true);
                    setError("");
                  }}
                  className="w-full rounded-2xl border-2 border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] px-4 py-3 font-bold text-[var(--color-primary)] transition hover:brightness-95"
                >
                  ＋ קטגוריה חדשה
                </button>
              </>
            )}

            {categoryId && (
              <SubcategorySelector
                subcategories={visibleSubcategories}
                value={subcategoryId}
                onChange={setSubcategoryId}
                onAddNew={() => {
                  setShowAddSubcategory(true);
                  setError("");
                }}
              />
            )}

            {showAddSubcategory && categoryId && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <label
                  htmlFor="new-subcategory"
                  className="text-sm font-semibold text-[var(--color-text)]"
                >
                  שם תת־הקטגוריה החדשה
                </label>

                <input
                  id="new-subcategory"
                  type="text"
                  value={newSubcategoryName}
                  onChange={(event) =>
                    setNewSubcategoryName(event.target.value)
                  }
                  placeholder="לדוגמה: וטרינר"
                 className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[var(--color-text)] caret-[var(--color-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubcategory(false);
                      setNewSubcategoryName("");
                      setError("");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]"
                  >
                    ביטול
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleAddSubcategory()}
                    className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    הוספה
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="transaction-notes"
                className="block text-sm font-semibold text-[var(--color-text)]"
              >
                הערות
                <span className="mr-1 font-normal text-[var(--color-text-secondary)]">
                  (לא חובה)
                </span>
              </label>

              <textarea
                id="transaction-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="אפשר להוסיף פרטים נוספים"
                rows={3}
               className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-right text-[var(--color-text)] caret-[var(--color-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!formIsValid || saving}
             className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] text-base font-black text-white shadow-[var(--shadow-medium)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "שומר..." : "שמירת תנועה"}
            </button>
          </form>
        </div>
      </main>

      <AddCategoryModal
        open={showAddCategory}
        initialType={type}
        onClose={() => setShowAddCategory(false)}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}