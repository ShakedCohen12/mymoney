"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import AddCategoryModal, {
  CreatedCategory,
} from "@/components/categories/AddCategoryModal";

type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string | null;
  color: string | null;
  user_id?: string | null;
};

type BudgetRow = {
  id: string;
  category_id: string;
  amount: number | string;
};

type TransactionRow = {
  type?: "expense" | "income";
  category_id: string;
  amount: number | string;
  transaction_date?: string;
};

type BudgetItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  spent: number;
};

type SuggestionSource = "history" | "income" | "mixed" | "fallback";
type SuggestionConfidence = "high" | "medium" | "low";

type BudgetSuggestion = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  averageSpent: number;
  incomeBasedAmount: number;
  selected: boolean;
  source: SuggestionSource;
  confidence: SuggestionConfidence;
  explanation: string;
};

const fallbackCategoryDetails: Record<
  string,
  {
    icon: string;
    color: string;
  }
> = {
  אוכל: {
    icon: "🍔",
    color: "#8B5CF6",
  },
  "רכב ותחבורה": {
    icon: "🚗",
    color: "#3B82F6",
  },
  קניות: {
    icon: "🛍️",
    color: "#EC4899",
  },
  חשבונות: {
    icon: "🧾",
    color: "#F59E0B",
  },
  אחר: {
    icon: "📦",
    color: "#64748B",
  },
};

function getCategoryStyle(category: Pick<Category, "name" | "icon" | "color">) {
  const fallback = fallbackCategoryDetails[category.name] ?? {
    icon: "📦",
    color: "#64748B",
  };

  return {
    icon: category.icon?.trim() || fallback.icon,
    color: category.color?.trim() || fallback.color,
  };
}

const incomeAllocationByCategory: Record<string, number> = {
  אוכל: 0.15,
  "רכב ותחבורה": 0.12,
  קניות: 0.08,
  חשבונות: 0.25,
  אחר: 0.05,
};

const flexibleCategoryWeight: Record<string, number> = {
  אוכל: 0.65,
  "רכב ותחבורה": 0.35,
  קניות: 1,
  חשבונות: 0.1,
  אחר: 0.8,
};

const fallbackBudgetsByCategory: Record<string, number> = {
  אוכל: 1200,
  "רכב ותחבורה": 900,
  קניות: 600,
  חשבונות: 1800,
  אחר: 400,
};

const HISTORY_MONTHS = 6;
const DEFAULT_SAVINGS_TARGET = 10;

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const startDate = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(year, monthNumber, 1);

  const endDate = `${nextMonthDate.getFullYear()}-${String(
    nextMonthDate.getMonth() + 1
  ).padStart(2, "0")}-01`;

  return {
    startDate,
    endDate,
  };
}

function getRecommendationRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const selectedMonthDate = new Date(year, monthNumber - 1, 1);

  const startDate = new Date(
    selectedMonthDate.getFullYear(),
    selectedMonthDate.getMonth() - HISTORY_MONTHS,
    1
  );

  return {
    startDate: `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1
    ).padStart(2, "0")}-01`,
    endDate: `${selectedMonthDate.getFullYear()}-${String(
      selectedMonthDate.getMonth() + 1
    ).padStart(2, "0")}-01`,
  };
}

function roundBudgetAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.max(50, Math.round(amount / 50) * 50);
}

function formatMonthTitle(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function getConfidenceLabel(confidence: SuggestionConfidence) {
  if (confidence === "high") {
    return "אמינות גבוהה";
  }

  if (confidence === "medium") {
    return "אמינות בינונית";
  }

  return "אמינות נמוכה";
}

function getSourceLabel(source: SuggestionSource) {
  if (source === "mixed") {
    return "לפי ההוצאות וההכנסה";
  }

  if (source === "history") {
    return "לפי חודשים קודמים";
  }

  if (source === "income") {
    return "לפי ההכנסה";
  }

  return "ברירת מחדל";
}

export default function BudgetsPage() {
  const router = useRouter();

  const [month, setMonth] = useState(getCurrentMonth());
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [currentMonthSpent, setCurrentMonthSpent] = useState<
    Record<string, number>
  >({});

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savingSuggestions, setSavingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [averageMonthlyIncome, setAverageMonthlyIncome] = useState(0);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState("");
  const [recommendationTransactions, setRecommendationTransactions] = useState<TransactionRow[]>([]);
  const [savingsTarget, setSavingsTarget] = useState(
    DEFAULT_SAVINGS_TARGET
  );
  const [suggestionError, setSuggestionError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const totalBudget = useMemo(() => {
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return budgets.reduce((total, budget) => total + budget.spent, 0);
  }, [budgets]);

  const totalPercentage =
    totalBudget > 0
      ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100)
      : 0;

  const availableCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        !budgets.some((budget) => budget.categoryId === category.id)
    );
  }, [categories, budgets]);

  const selectedSuggestedTotal = useMemo(() => {
    return suggestions
      .filter((suggestion) => suggestion.selected)
      .reduce(
        (total, suggestion) => total + Number(suggestion.amount || 0),
        0
      );
  }, [suggestions]);

  const expectedSavings = Math.max(
    0,
    averageMonthlyIncome - selectedSuggestedTotal
  );

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("לא נמצא משתמש מחובר.");
        }

        const { startDate, endDate } = getMonthRange(month);

        const [
          { data: categoryData, error: categoryError },
          { data: budgetData, error: budgetError },
          { data: transactionData, error: transactionError },
        ] = await Promise.all([
          supabase
            .from("categories")
            .select("id, name, type, icon, color, user_id")
            .eq("type", "expense")
            .or(`user_id.is.null,user_id.eq.${user.id}`)
            .order("name"),

          supabase
            .from("budgets")
            .select("id, category_id, amount")
            .eq("user_id", user.id)
            .eq("month", month),

          supabase
            .from("transactions")
            .select("category_id, amount")
            .eq("user_id", user.id)
            .eq("type", "expense")
            .gte("transaction_date", startDate)
            .lt("transaction_date", endDate),
        ]);

        if (categoryError) {
          console.error("Load categories error:", categoryError);
          throw new Error("לא הצלחנו לטעון את הקטגוריות.");
        }

        if (budgetError) {
          console.error("Load budgets error:", budgetError);
          throw new Error("לא הצלחנו לטעון את התקציבים.");
        }

        if (transactionError) {
          console.error("Load transactions error:", transactionError);
          throw new Error("לא הצלחנו לחשב את ההוצאות החודשיות.");
        }

        const loadedCategories = (categoryData as Category[] | null) ?? [];
        const loadedBudgets = (budgetData as BudgetRow[] | null) ?? [];
        const loadedTransactions =
          (transactionData as TransactionRow[] | null) ?? [];

        const spentByCategory = loadedTransactions.reduce<
          Record<string, number>
        >((accumulator, transaction) => {
          accumulator[transaction.category_id] =
            (accumulator[transaction.category_id] ?? 0) +
            Number(transaction.amount);

          return accumulator;
        }, {});

        const nextBudgets: BudgetItem[] = loadedBudgets
          .map((budget) => {
            const category = loadedCategories.find(
              (item) => item.id === budget.category_id
            );

            if (!category) {
              return null;
            }

            const style = getCategoryStyle(category);

            return {
              id: budget.id,
              categoryId: budget.category_id,
              categoryName: category.name,
              categoryIcon: style.icon,
              categoryColor: style.color,
              amount: Number(budget.amount),
              spent: spentByCategory[budget.category_id] ?? 0,
            };
          })
          .filter((budget): budget is BudgetItem => budget !== null);

        setCategories(loadedCategories);
        setBudgets(nextBudgets);
        setCurrentMonthSpent(spentByCategory);
      } catch (caughtError) {
        console.error("Load budgets page error:", caughtError);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "לא הצלחנו לטעון את התקציבים."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, [month]);

  function moveMonth(direction: "previous" | "next") {
    const [year, monthNumber] = month.split("-").map(Number);

    const nextDate = new Date(
      year,
      monthNumber - 1 + (direction === "next" ? 1 : -1),
      1
    );

    setMonth(
      `${nextDate.getFullYear()}-${String(
        nextDate.getMonth() + 1
      ).padStart(2, "0")}-01`
    );
  }

function openNewBudgetModal() {
  setEditingBudgetId(null);
  setSelectedCategoryId("");
  setBudgetAmount("");
  setError("");
  setSuccessMessage("");
  setShowAddCategoryModal(true);
}

  function openEditBudgetModal(budget: BudgetItem) {
    setEditingBudgetId(budget.id);
    setSelectedCategoryId(budget.categoryId);
    setBudgetAmount(String(budget.amount));
    setError("");
    setSuccessMessage("");
    setShowBudgetModal(true);
  }

  function closeBudgetModal() {
    if (saving) {
      return;
    }
    setShowBudgetModal(false);
    setEditingBudgetId(null);
    setSelectedCategoryId("");
    setBudgetAmount("");
  }

  function handleCategoryCreated(category: CreatedCategory) {
  const normalizedCategory: Category = {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    user_id: category.user_id,
  };

  setCategories((current) =>
    [...current, normalizedCategory].sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    )
  );

  setSelectedCategoryId(category.id);
  setShowAddCategoryModal(false);
  setShowBudgetModal(true);
  setError("");
}

  function closeSuggestionModal() {
    if (savingSuggestions) {
      return;
    }

    setShowSuggestionModal(false);
    setSuggestions([]);
    setSuggestionError("");
  }

  async function handleSaveBudget() {
    setError("");
    setSuccessMessage("");

    const amount = Number(budgetAmount);

    if (!selectedCategoryId) {
      setError("בחרי קטגוריה לתקציב.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("הזיני סכום תקציב גדול מאפס.");
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

      if (editingBudgetId) {
        const { error: updateError } = await supabase
          .from("budgets")
          .update({
            amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBudgetId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Update budget error:", updateError);
          throw new Error("לא הצלחנו לעדכן את התקציב.");
        }

        setBudgets((current) =>
          current.map((budget) =>
            budget.id === editingBudgetId
              ? {
                  ...budget,
                  amount,
                }
              : budget
          )
        );

        setSuccessMessage("התקציב עודכן בהצלחה.");
      } else {
        const selectedCategory = categories.find(
          (category) => category.id === selectedCategoryId
        );

        if (!selectedCategory) {
          throw new Error("הקטגוריה שנבחרה אינה תקינה.");
        }

        const { data: createdBudget, error: insertError } = await supabase
          .from("budgets")
          .insert({
            user_id: user.id,
            category_id: selectedCategory.id,
            amount,
            month,
          })
          .select("id, category_id, amount")
          .single();

        if (insertError || !createdBudget) {
          console.error("Create budget error:", insertError);

          if (insertError?.code === "23505") {
            throw new Error("כבר קיים תקציב לקטגוריה הזאת בחודש שנבחר.");
          }

          throw new Error("לא הצלחנו ליצור את התקציב.");
        }

        const selectedCategoryStyle = getCategoryStyle(selectedCategory);

        setBudgets((current) => [
          ...current,
          {
            id: createdBudget.id,
            categoryId: selectedCategory.id,
            categoryName: selectedCategory.name,
            categoryIcon: selectedCategoryStyle.icon,
            categoryColor: selectedCategoryStyle.color,
            amount: Number(createdBudget.amount),
            spent: currentMonthSpent[selectedCategory.id] ?? 0,
          },
        ]);

        setSuccessMessage("התקציב נוסף בהצלחה.");
      }

      setShowBudgetModal(false);
      setEditingBudgetId(null);
      setSelectedCategoryId("");
      setBudgetAmount("");
      router.refresh();
    } catch (caughtError) {
      console.error("Save budget error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו לשמור את התקציב."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    const confirmed = window.confirm(
      "למחוק את התקציב? התנועות עצמן לא יימחקו."
    );

    if (!confirmed) {
      return;
    }

    setDeletingBudgetId(budgetId);
    setError("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("לא נמצא משתמש מחובר.");
      }

      const { error: deleteError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Delete budget error:", deleteError);
        throw new Error("לא הצלחנו למחוק את התקציב.");
      }

      setBudgets((current) =>
        current.filter((budget) => budget.id !== budgetId)
      );

      setSuccessMessage("התקציב נמחק.");
      router.refresh();
    } catch (caughtError) {
      console.error("Delete budget error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו למחוק את התקציב."
      );
    } finally {
      setDeletingBudgetId(null);
    }
  }

  function buildSuggestions(
    historyTransactions: TransactionRow[],
    targetSavingsPercentage: number,
    monthlyIncomeOverride?: number
  ) {
    const incomeTransactions = historyTransactions.filter(
      (transaction) => transaction.type === "income"
    );

    const expenseTransactions = historyTransactions.filter(
      (transaction) => transaction.type === "expense"
    );

    const totalIncome = incomeTransactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

    const historicalMonthlyIncome = totalIncome / HISTORY_MONTHS;
    const monthlyIncome =
      monthlyIncomeOverride !== undefined && monthlyIncomeOverride >= 0
        ? monthlyIncomeOverride
        : historicalMonthlyIncome;

    setAverageMonthlyIncome(monthlyIncome);
    setMonthlyIncomeInput(String(Math.round(monthlyIncome)));

    const baseSuggestions = categories.map((category) => {
      const totalCategorySpent = expenseTransactions
        .filter(
          (transaction) => transaction.category_id === category.id
        )
        .reduce(
          (total, transaction) => total + Number(transaction.amount),
          0
        );

      const averageSpent = totalCategorySpent / HISTORY_MONTHS;
      const incomeAllocation =
        incomeAllocationByCategory[category.name] ?? 0.05;
      const incomeBasedAmount = monthlyIncome * incomeAllocation;

      let source: SuggestionSource = "fallback";
      let confidence: SuggestionConfidence = "low";
      let recommendedAmount =
        fallbackBudgetsByCategory[category.name] ?? 500;
      let explanation =
        "עדיין אין מספיק מידע, לכן זו הצעת פתיחה של המערכת.";

      if (averageSpent > 0 && monthlyIncome > 0) {
        source = "mixed";
        confidence = "high";
        recommendedAmount = averageSpent * 0.7 + incomeBasedAmount * 0.3;
        explanation = `הממוצע שלך בחצי השנה האחרונה הוא ${formatCurrency(
          averageSpent
        )}, וההצעה הותאמה גם להכנסה החודשית.`;
      } else if (averageSpent > 0) {
        source = "history";
        confidence = "medium";
        recommendedAmount = averageSpent;
        explanation = `ההצעה מבוססת על ממוצע הוצאה של ${formatCurrency(
          averageSpent
        )} בחצי השנה האחרונה.`;
      } else if (monthlyIncome > 0) {
        source = "income";
        confidence = "medium";
        recommendedAmount = incomeBasedAmount;
        explanation = `לא נמצאה היסטוריית הוצאות מספקת, לכן ההצעה חושבה לפי ההכנסה החודשית.`;
      }

      const style = getCategoryStyle(category);

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: style.icon,
        categoryColor: style.color,
        amount: recommendedAmount,
        averageSpent,
        incomeBasedAmount,
        selected: true,
        source,
        confidence,
        explanation,
      };
    });

    const availableForBudgets =
      monthlyIncome > 0
        ? monthlyIncome * (1 - targetSavingsPercentage / 100)
        : 0;

    const totalBaseAmount = baseSuggestions.reduce(
      (total, suggestion) => total + suggestion.amount,
      0
    );

    let adjustedSuggestions = baseSuggestions;

    if (
      monthlyIncome > 0 &&
      totalBaseAmount > availableForBudgets &&
      availableForBudgets > 0
    ) {
      const amountToReduce = totalBaseAmount - availableForBudgets;
      const totalFlexibility = baseSuggestions.reduce(
        (total, suggestion) =>
          total +
          suggestion.amount *
            (flexibleCategoryWeight[suggestion.categoryName] ?? 0.5),
        0
      );

      adjustedSuggestions = baseSuggestions.map((suggestion) => {
        const flexibility =
          flexibleCategoryWeight[suggestion.categoryName] ?? 0.5;

        const weightedShare =
          totalFlexibility > 0
            ? (suggestion.amount * flexibility) / totalFlexibility
            : 0;

        const reduction = amountToReduce * weightedShare;
        const minimumAmount = suggestion.amount * 0.55;

        return {
          ...suggestion,
          amount: Math.max(minimumAmount, suggestion.amount - reduction),
        };
      });
    }

    return adjustedSuggestions.map((suggestion) => ({
      ...suggestion,
      amount: roundBudgetAmount(suggestion.amount),
      averageSpent: roundBudgetAmount(suggestion.averageSpent),
      incomeBasedAmount: roundBudgetAmount(suggestion.incomeBasedAmount),
    }));
  }

  async function handleOpenSystemSuggestion() {
    setLoadingSuggestions(true);
    setError("");
    setSuccessMessage("");
    setSuggestionError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("לא נמצא משתמש מחובר.");
      }

      const { startDate, endDate } = getRecommendationRange(month);

      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("type, amount, category_id, transaction_date")
        .eq("user_id", user.id)
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate);

      if (transactionError) {
        console.error(
          "Load recommendation transactions error:",
          transactionError
        );

        throw new Error("לא הצלחנו לחשב את הצעת המערכת.");
      }

      const historyTransactions =
        (transactionData as TransactionRow[] | null) ?? [];

      setRecommendationTransactions(historyTransactions);
      setSuggestions(
        buildSuggestions(historyTransactions, DEFAULT_SAVINGS_TARGET)
      );
      setSavingsTarget(DEFAULT_SAVINGS_TARGET);
      setShowSuggestionModal(true);
    } catch (caughtError) {
      console.error("System suggestion error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו ליצור הצעת תקציב."
      );
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function handleSavingsTargetChange(target: number) {
    setSavingsTarget(target);
    setSuggestionError("");

    const enteredIncome = Number(monthlyIncomeInput);
    const incomeOverride =
      Number.isFinite(enteredIncome) && enteredIncome >= 0
        ? enteredIncome
        : undefined;

    setSuggestions(
      buildSuggestions(
        recommendationTransactions,
        target,
        incomeOverride
      )
    );
  }

  function handleIncomeBlur() {
    const enteredIncome = Number(monthlyIncomeInput);

    if (!Number.isFinite(enteredIncome) || enteredIncome < 0) {
      setSuggestionError("הזיני הכנסה חודשית תקינה.");
      return;
    }

    setSuggestionError("");
    setSuggestions(
      buildSuggestions(
        recommendationTransactions,
        savingsTarget,
        enteredIncome
      )
    );
  }

  function handleSuggestionAmountChange(
    categoryId: string,
    value: string
  ) {
    const sanitizedValue = value.replace(/[^\d.]/g, "");

    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.categoryId === categoryId
          ? {
              ...suggestion,
              amount: Number(sanitizedValue),
            }
          : suggestion
      )
    );
  }

  function toggleSuggestion(categoryId: string) {
    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.categoryId === categoryId
          ? {
              ...suggestion,
              selected: !suggestion.selected,
            }
          : suggestion
      )
    );
  }

  async function handleApplySuggestions() {
    const selectedSuggestions = suggestions.filter(
      (suggestion) =>
        suggestion.selected &&
        Number.isFinite(Number(suggestion.amount)) &&
        Number(suggestion.amount) > 0
    );

    if (selectedSuggestions.length === 0) {
      setSuggestionError("בחרי לפחות קטגוריה אחת להצעת התקציב.");
      return;
    }

    setSavingSuggestions(true);
    setSuggestionError("");
    setError("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("לא נמצא משתמש מחובר");
      }

      const budgetsToSave = selectedSuggestions.map((suggestion) => ({
        user_id: user.id,
        category_id: suggestion.categoryId,
        amount: Number(suggestion.amount),
        month,
        updated_at: new Date().toISOString(),
      }));

      const { data: savedBudgets, error: saveError } = await supabase
        .from("budgets")
        .upsert(budgetsToSave, {
          onConflict: "user_id,category_id,month",
        })
        .select("id, category_id, amount");

      if (saveError || !savedBudgets) {
        console.error("Save system suggestions error:", saveError);
        throw new Error("לא הצלחנו לשמור את הצעת המערכת.");
      }

      setBudgets((currentBudgets) => {
        const nextBudgets = [...currentBudgets];

        savedBudgets.forEach((savedBudget) => {
          const category = categories.find(
            (item) => item.id === savedBudget.category_id
          );

          if (!category) {
            return;
          }

          const existingIndex = nextBudgets.findIndex(
            (budget) => budget.categoryId === savedBudget.category_id
          );

          const style = getCategoryStyle(category);

          const nextBudget: BudgetItem = {
            id: savedBudget.id,
            categoryId: savedBudget.category_id,
            categoryName: category.name,
            categoryIcon: style.icon,
            categoryColor: style.color,
            amount: Number(savedBudget.amount),
            spent: currentMonthSpent[savedBudget.category_id] ?? 0,
          };

          if (existingIndex >= 0) {
            nextBudgets[existingIndex] = nextBudget;
          } else {
            nextBudgets.push(nextBudget);
          }
        });

        return nextBudgets;
      });

      setShowSuggestionModal(false);
      setSuggestions([]);
      setSuccessMessage("הצעת המערכת נשמרה בהצלחה");
      router.refresh();
    } catch (caughtError) {
      console.error("Apply system suggestions error:", caughtError);

      setSuggestionError(
        caughtError instanceof Error
          ? caughtError.message
          : "לא הצלחנו לשמור את הצעת המערכת"
      );
    } finally {
      setSavingSuggestions(false);
    }
  }
  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-5"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary-light)] border-t-[var(--color-primary)]" />

          <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">
            טוען תקציבים...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--color-background)]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--color-primary)]">
              התקציבים שלי
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)] text-xl text-[var(--color-primary)] shadow-[var(--shadow-small)] transition hover:brightness-95"
            aria-label="חזרה"
          >
            ←
          </button>
        </header>

        <section className="relative overflow-hidden rounded-[36px] bg-[var(--color-primary)] p-6 text-white shadow-[var(--shadow-medium)]">
          <div className="absolute -left-14 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth("previous")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition hover:bg-white/25 active:scale-95"
                aria-label="חודש קודם"
              >
                ›
              </button>

              <div className="text-center">
                <p className="text-sm font-medium text-white/75">
                  התקציבים עבור
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {formatMonthTitle(month)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => moveMonth("next")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition hover:bg-white/25 active:scale-95"
                aria-label="חודש הבא"
              >
                ‹
              </button>
            </div>

            <div className="mt-7 rounded-[26px] border border-white/10 bg-white/15 p-5 backdrop-blur">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/75">
                    נוצל מתוך כלל התקציבים
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {formatCurrency(totalSpent)}
                  </p>

                  <p className="mt-1 text-sm text-white/75">
                    מתוך {formatCurrency(totalBudget)}
                  </p>
                </div>

                <p className="text-2xl font-black">
                  {totalPercentage}%
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${totalPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openNewBudgetModal}
            disabled={availableCategories.length === 0}
            className="flex min-h-14 items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[var(--color-primary)]/35 bg-[var(--color-primary-light)] px-4 font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-xl">＋</span>

            <span>
              {availableCategories.length === 0
                ? "כל הקטגוריות נוספו"
                : "הוספת תקציב"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenSystemSuggestion}
            disabled={loadingSuggestions || categories.length === 0}
            className="flex min-h-14 items-center justify-center gap-2 rounded-[22px] bg-[var(--color-primary)] px-4 font-bold text-white shadow-[var(--shadow-medium)] transition hover:brightness-105 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-xl">✨</span>

            <span>
              {loadingSuggestions
                ? "מחשב הצעה..."
                : "הצעת מערכת"}
            </span>
          </button>
        </div>

        {error && (
          <p className="mt-5 rounded-[20px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-5 rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
            {successMessage}
          </p>
        )}

        <section className="mt-6 space-y-4">
          {budgets.length === 0 ? (
            <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-small)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-4xl">
                🎯
              </div>

              <h2 className="mt-5 text-xl font-black text-[var(--color-text)]">
                עדיין לא הגדרת תקציבים
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
                אפשר לבחור תקציבים ידנית או לקבל הצעה חכמה לפי ההכנסה
                והחודשים הקודמים.
              </p>

              <button
                type="button"
                onClick={handleOpenSystemSuggestion}
                disabled={loadingSuggestions}
                className="mt-5 rounded-[20px] bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-[var(--shadow-medium)] transition hover:brightness-105 active:scale-[0.985] disabled:opacity-50"
              >
                {loadingSuggestions
                  ? "מחשב הצעה..."
                  : "✨ קבלת הצעת מערכת"}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {budgets.map((budget) => {
                const rawPercentage =
                  budget.amount > 0
                    ? Math.round(
                        (budget.spent / budget.amount) * 100
                      )
                    : 0;

                const progressPercentage = Math.min(
                  rawPercentage,
                  100
                );

                const remaining =
                  budget.amount - budget.spent;

                const isOverBudget = remaining < 0;

                return (
                  <article
                    key={budget.id}
                    className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-small)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-medium)]"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                        style={{
                          backgroundColor: `${budget.categoryColor}18`,
                        }}
                      >
                        {budget.categoryIcon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-black text-[var(--color-text)]">
                              {budget.categoryName}
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                              {formatCurrency(budget.spent)} מתוך{" "}
                              {formatCurrency(budget.amount)}
                            </p>
                          </div>

                          <p
                            className={`shrink-0 text-lg font-black ${
                              isOverBudget
                                ? "text-red-500"
                                : "text-[var(--color-text)]"
                            }`}
                          >
                            {rawPercentage}%
                          </p>
                        </div>

                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-background)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverBudget
                                ? "bg-red-500"
                                : rawPercentage >= 80
                                ? "bg-amber-500"
                                : "bg-[var(--color-primary)]"
                            }`}
                            style={{
                              width: `${progressPercentage}%`,
                            }}
                          />
                        </div>

                        <p
                          className={`mt-3 text-sm font-medium ${
                            isOverBudget
                              ? "text-red-500"
                              : "text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {isOverBudget
                            ? `חריגה של ${formatCurrency(
                                Math.abs(remaining)
                              )}`
                            : `נותרו ${formatCurrency(
                                remaining
                              )}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-[var(--color-border)] pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          openEditBudgetModal(budget)
                        }
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-light)] text-sm font-bold text-[var(--color-primary)] transition hover:brightness-95 active:scale-[0.985]"
                      >
                        ✏️ עריכה
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteBudget(budget.id)
                        }
                        disabled={
                          deletingBudgetId === budget.id
                        }
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/10 text-sm font-bold text-red-500 transition hover:bg-red-500/15 active:scale-[0.985] disabled:opacity-50"
                      >
                        {deletingBudgetId === budget.id
                          ? "מוחק..."
                          : "🗑️ מחיקה"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showBudgetModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeBudgetModal();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--color-primary)]">
                  {editingBudgetId
                    ? "שינוי תקציב"
                    : "תקציב חדש"}
                </p>

                <h2 className="mt-1 text-2xl font-black text-[var(--color-text)]">
                  {editingBudgetId
                    ? "עריכת הסכום"
                    : "לאיזו קטגוריה?"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeBudgetModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-xl text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                aria-label="סגירה"
              >
                ×
              </button>
            </div>

            {!editingBudgetId && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {availableCategories.map((category) => {
                    const details =
                      getCategoryStyle(category);

                    const selected =
                      selectedCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setError("");
                        }}
                        className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 p-3 transition ${
                          selected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-sm"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/40"
                        }`}
                      >
                        <span className="text-3xl">
                          {details.icon}
                        </span>

                        <span className="mt-2 text-sm font-bold text-[var(--color-text)]">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(true);
                    setError("");
                  }}
                  className="mt-4 w-full rounded-2xl border-2 border-dashed border-[var(--color-primary)]/35 bg-[var(--color-primary-light)] px-4 py-3 font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
                >
                  ＋ יצירת קטגוריה חדשה
                </button>
              </>
            )}

            {editingBudgetId && (
              <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-light)] p-4">
                <p className="text-sm font-medium text-[var(--color-primary)]">
                  קטגוריה
                </p>

                <p className="mt-1 font-bold text-[var(--color-text)]">
                  {
                    categories.find(
                      (category) =>
                        category.id === selectedCategoryId
                    )?.name
                  }
                </p>
              </div>
            )}

            <div className="mt-6">
              <label
                htmlFor="budget-amount"
                className="block text-sm font-bold text-[var(--color-text)]"
              >
                סכום חודשי
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--color-text-secondary)]">
                  ₪
                </span>

                <input
                  id="budget-amount"
                  type="text"
                  inputMode="decimal"
                  value={budgetAmount}
                  onChange={(event) => {
                    setBudgetAmount(
                      event.target.value.replace(
                        /[^\d.]/g,
                        ""
                      )
                    );
                    setError("");
                  }}
                  placeholder="0"
                  className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] pr-12 pl-4 text-left text-2xl font-black text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]"
                />
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={closeBudgetModal}
                disabled={saving}
                className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 font-bold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)] disabled:opacity-50"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleSaveBudget}
                disabled={
                  saving ||
                  !selectedCategoryId ||
                  Number(budgetAmount) <= 0
                }
                className="flex-1 rounded-2xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white shadow-[var(--shadow-medium)] transition hover:brightness-105 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "שומר..."
                  : editingBudgetId
                  ? "שמירת שינויים"
                  : "הוספת תקציב"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCategoryModal
        open={showAddCategoryModal}
        initialType="expense"
        onClose={() =>
          setShowAddCategoryModal(false)
        }
        onCreated={handleCategoryCreated}
      />

      {showSuggestionModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSuggestionModal();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--color-primary)]">
                   הצעת מערכת ✨
                </p>

                <h2 className="mt-1 text-2xl font-black text-[var(--color-text)]">
                  התקציב המומלץ עבורך
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  ההצעה משלבת את ההכנסה שלך עם ממוצע
                  ההוצאות בחצי השנה האחרונה.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSuggestionModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-xl text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                aria-label="סגירה"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-light)] p-4">
                <label
                  htmlFor="monthly-income"
                  className="text-xs font-medium text-[var(--color-text-secondary)]"
                >
                  הכנסה חודשית
                </label>

                <div className="relative mt-2">
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[var(--color-primary)]">
                    ₪
                  </span>

                  <input
                    id="monthly-income"
                    type="text"
                    inputMode="decimal"
                    value={monthlyIncomeInput}
                    onChange={(event) => {
                      setMonthlyIncomeInput(
                        event.target.value.replace(
                          /[^\d.]/g,
                          ""
                        )
                      );
                    }}
                    onBlur={handleIncomeBlur}
                    className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pr-8 pl-2 text-left text-lg font-bold text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]"
                    placeholder="0"
                  />
                </div>

                <p className="mt-2 text-[11px] leading-4 text-[var(--color-text-secondary)]">
                  מילאנו לפי ההיסטוריה. אפשר לערוך את
                  הסכום.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs font-medium text-emerald-500">
                  חיסכון צפוי
                </p>

                <p className="mt-1 text-xl font-black text-emerald-500">
                  {formatCurrency(expectedSavings)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[var(--color-text)]">
                    יעד חיסכון
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    המערכת תפחית יותר מקטגוריות גמישות
                    ופחות מחשבונות.
                  </p>
                </div>

                <span className="text-lg font-black text-[var(--color-primary)]">
                  {savingsTarget}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() =>
                      handleSavingsTargetChange(target)
                    }
                    className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                      savingsTarget === target
                        ? "bg-[var(--color-primary)] text-white"
                        : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                    }`}
                  >
                    {target}%
                  </button>
                ))}
              </div>
            </div>

            {averageMonthlyIncome === 0 && (
              <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-500">
                לא נמצאה הכנסה בחצי השנה האחרונה. ההצעה
                תתבסס על הוצאות קודמות, ואם גם הן חסרות —
                על סכומי פתיחה של המערכת.
              </p>
            )}

            {suggestionError && (
              <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                {suggestionError}
              </p>
            )}

            <div className="mt-5 space-y-3">
              {suggestions.map((suggestion) => (
                <article
                  key={suggestion.categoryId}
                  className={`rounded-2xl border p-4 transition ${
                    suggestion.selected
                      ? "border-[var(--color-primary)]/25 bg-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-background)] opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        toggleSuggestion(
                          suggestion.categoryId
                        )
                      }
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition ${
                        suggestion.selected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-[var(--color-border)] bg-[var(--color-background)] text-transparent"
                      }`}
                    >
                      ✓
                    </button>

                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                      style={{
                        backgroundColor: `${suggestion.categoryColor}18`,
                      }}
                    >
                      {suggestion.categoryIcon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-[var(--color-text)]">
                            {suggestion.categoryName}
                          </h3>

                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-1 text-[11px] font-bold text-[var(--color-primary)]">
                              {getSourceLabel(
                                suggestion.source
                              )}
                            </span>

                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                suggestion.confidence ===
                                "high"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : suggestion.confidence ===
                                    "medium"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)]"
                              }`}
                            >
                              {getConfidenceLabel(
                                suggestion.confidence
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="relative w-28 shrink-0">
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)]">
                            ₪
                          </span>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              Number.isFinite(
                                suggestion.amount
                              )
                                ? suggestion.amount
                                : ""
                            }
                            disabled={!suggestion.selected}
                            onChange={(event) =>
                              handleSuggestionAmountChange(
                                suggestion.categoryId,
                                event.target.value
                              )
                            }
                            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pr-8 pl-2 text-left font-bold text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)] disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {suggestion.explanation}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  סך התקציב המומלץ
                </span>

                <span className="text-xl font-black text-[var(--color-text)]">
                  {formatCurrency(selectedSuggestedTotal)}
                </span>
              </div>

              {averageMonthlyIncome > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    יישאר לאחר התקציבים
                  </span>

                  <span
                    className={`text-lg font-black ${
                      expectedSavings > 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {formatCurrency(expectedSavings)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeSuggestionModal}
                disabled={savingSuggestions}
                className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 font-bold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)] disabled:opacity-50"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleApplySuggestions}
                disabled={
                  savingSuggestions ||
                  !suggestions.some(
                    (suggestion) =>
                      suggestion.selected &&
                      suggestion.amount > 0
                  )
                }
                className="flex-1 rounded-2xl bg-[var(--color-primary)] px-4 py-3 font-bold text-white shadow-[var(--shadow-medium)] transition hover:brightness-105 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingSuggestions
                  ? "שומר הצעה..."
                  : "אישור ושמירה"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
