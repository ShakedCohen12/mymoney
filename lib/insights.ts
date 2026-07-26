export type InsightTransaction = {
  amount: number | string;
  type: "expense" | "income";
  transaction_date: string;
  notes?: string | null;

  categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  user_subcategories?:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export type FinancialInsight = {
  id: string;
  title: string;
  description: string;
  value: string;
  type: "positive" | "warning" | "negative" | "neutral";
};

type ExpenseSummary = {
  transaction: InsightTransaction;
  amount: number;
  category: string;
  subcategory: string | null;
  displayName: string;
};

const WEEKDAY_NAMES = [
  "יום ראשון",
  "יום שני",
  "יום שלישי",
  "יום רביעי",
  "יום חמישי",
  "יום שישי",
  "יום שבת",
];

function getRelatedName(
  relation:
    | { name: string }
    | { name: string }[]
    | null
    | undefined
) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation.name;
}

function getTransactionDate(transaction: InsightTransaction) {
  return new Date(transaction.transaction_date);
}

function getStartOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

function getStartOfWeek(date: Date) {
  const result = getStartOfDay(date);

  result.setDate(result.getDate() - result.getDay());

  return result;
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function isBetween(date: Date, start: Date, end: Date) {
  return date >= start && date < end;
}

function isInMonth(transaction: InsightTransaction, monthDate: Date) {
  const date = getTransactionDate(transaction);

  return isBetween(
    date,
    getStartOfMonth(monthDate),
    getEndOfMonth(monthDate)
  );
}

function sumTransactions(transactions: InsightTransaction[]) {
  return transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("he-IL")} ₪`;
}

function formatPercentage(value: number) {
  return `${Math.abs(Math.round(value)).toLocaleString("he-IL")}%`;
}

function buildExpenseSummary(
  transaction: InsightTransaction
): ExpenseSummary {
  const category =
    getRelatedName(transaction.categories) ?? "ללא קטגוריה";

  const subcategory = getRelatedName(
    transaction.user_subcategories
  );

  const cleanNotes = transaction.notes?.trim();

  const displayName =
    cleanNotes ||
    subcategory ||
    category;

  return {
    transaction,
    amount: Number(transaction.amount),
    category,
    subcategory,
    displayName,
  };
}

function groupAmountsByKey<T>(
  items: T[],
  getKey: (item: T) => string,
  getAmount: (item: T) => number
) {
  const totals = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    const amount = getAmount(item);

    totals.set(key, (totals.get(key) ?? 0) + amount);
  });

  return Array.from(totals.entries()).sort(
    (first, second) => second[1] - first[1]
  );
}

function calculatePercentageChange(
  currentValue: number,
  previousValue: number
) {
  if (previousValue <= 0) {
    return null;
  }

  return (
    ((currentValue - previousValue) / previousValue) *
    100
  );
}

export function generateFinancialInsights(
  transactions: InsightTransaction[]
): FinancialInsight[] {
  const now = new Date();

  const previousMonthDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const currentWeekStart = getStartOfWeek(now);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const previousWeekEnd = new Date(currentWeekStart);

  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense"
  );

  const incomes = transactions.filter(
    (transaction) => transaction.type === "income"
  );

  const currentMonthExpenses = expenses.filter((transaction) =>
    isInMonth(transaction, now)
  );

  const previousMonthExpenses = expenses.filter((transaction) =>
    isInMonth(transaction, previousMonthDate)
  );

  const currentMonthIncome = incomes.filter((transaction) =>
    isInMonth(transaction, now)
  );

  const currentWeekExpenses = expenses.filter((transaction) =>
    isBetween(
      getTransactionDate(transaction),
      currentWeekStart,
      new Date(
        currentWeekStart.getFullYear(),
        currentWeekStart.getMonth(),
        currentWeekStart.getDate() + 7
      )
    )
  );

  const previousWeekExpenses = expenses.filter((transaction) =>
    isBetween(
      getTransactionDate(transaction),
      previousWeekStart,
      previousWeekEnd
    )
  );

  const currentMonthExpenseTotal = sumTransactions(
    currentMonthExpenses
  );

  const previousMonthExpenseTotal = sumTransactions(
    previousMonthExpenses
  );

  const currentMonthIncomeTotal = sumTransactions(
    currentMonthIncome
  );

  const currentWeekExpenseTotal = sumTransactions(
    currentWeekExpenses
  );

  const previousWeekExpenseTotal = sumTransactions(
    previousWeekExpenses
  );

  const balance =
    currentMonthIncomeTotal - currentMonthExpenseTotal;

  const insights: FinancialInsight[] = [];

  const expenseSummaries = currentMonthExpenses.map(
    buildExpenseSummary
  );

  const categoryTotals = groupAmountsByKey(
    expenseSummaries,
    (expense) => expense.category,
    (expense) => expense.amount
  );

  const subcategoryTotals = groupAmountsByKey(
    expenseSummaries.filter(
      (expense) => expense.subcategory !== null
    ),
    (expense) => expense.subcategory ?? expense.category,
    (expense) => expense.amount
  );

  const topCategory = categoryTotals[0];
  const topSubcategory = subcategoryTotals[0];

  const largestExpense = [...expenseSummaries].sort(
    (first, second) => second.amount - first.amount
  )[0];

  const monthlyChange = calculatePercentageChange(
    currentMonthExpenseTotal,
    previousMonthExpenseTotal
  );

  const weeklyChange = calculatePercentageChange(
    currentWeekExpenseTotal,
    previousWeekExpenseTotal
  );

  /*
   * 1. שינוי בהוצאות החודש
   */
  if (monthlyChange !== null && monthlyChange !== 0) {
    const increased = monthlyChange > 0;

    insights.push({
      id: "monthly-expense-change",
      title: increased
        ? "ההוצאות החודשיות עלו"
        : "ההוצאות החודשיות ירדו",
      description: increased
        ? `הוצאת החודש ${formatPercentage(
            monthlyChange
          )} יותר לעומת החודש הקודם.`
        : `הוצאת החודש ${formatPercentage(
            monthlyChange
          )} פחות לעומת החודש הקודם.`,
      value: `${increased ? "+" : "-"}${formatPercentage(
        monthlyChange
      )}`,
      type: increased ? "warning" : "positive",
    });
  }

  /*
   * 2. הקטגוריה הגדולה ביותר
   */
  if (topCategory && currentMonthExpenseTotal > 0) {
    const categoryPercentage = Math.round(
      (topCategory[1] / currentMonthExpenseTotal) * 100
    );

    insights.push({
      id: "top-category",
      title: `רוב ההוצאות היו על ${topCategory[0]}`,
      description: `הוצאת החודש ${formatCurrency(
        topCategory[1]
      )} בקטגוריית ${topCategory[0]}, שהם ${categoryPercentage}% מכלל ההוצאות שלך.`,
      value: formatCurrency(topCategory[1]),
      type:
        categoryPercentage >= 50
          ? "warning"
          : "neutral",
    });
  }

  /*
   * 3. תת-הקטגוריה הבולטת
   */
  if (
    topSubcategory &&
    topSubcategory[0] !== topCategory?.[0]
  ) {
    insights.push({
      id: "top-subcategory",
      title: `${topSubcategory[0]} בולטת בהוצאות שלך`,
      description: `בתת־קטגוריה ${topSubcategory[0]} הוצאת החודש ${formatCurrency(
        topSubcategory[1]
      )}.`,
      value: formatCurrency(topSubcategory[1]),
      type: "neutral",
    });
  }

  /*
   * 4. ההוצאה הגדולה ביותר ועל מה היא הייתה
   */
  if (largestExpense) {
    const date = new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
    }).format(
      getTransactionDate(largestExpense.transaction)
    );

    const categoryDetails =
      largestExpense.subcategory &&
      largestExpense.displayName !== largestExpense.subcategory
        ? `${largestExpense.subcategory}, ${largestExpense.category}`
        : largestExpense.category;

    insights.push({
      id: "largest-expense",
      title: `ההוצאה הגדולה ביותר הייתה על ${largestExpense.displayName}`,
      description: `העסקה נרשמה ב־${date} תחת ${categoryDetails}.`,
      value: formatCurrency(largestExpense.amount),
      type: "warning",
    });
  }

  /*
   * 5. הוצאות קטנות שמצטברות
   */
  const smallExpenses = expenseSummaries.filter(
    (expense) => expense.amount > 0 && expense.amount <= 50
  );

  const smallExpensesTotal = smallExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  if (
    smallExpenses.length >= 4 &&
    smallExpensesTotal >= 100
  ) {
    insights.push({
      id: "small-expenses",
      title: "ההוצאות הקטנות מצטברות",
      description: `ביצעת החודש ${smallExpenses.length.toLocaleString(
        "he-IL"
      )} עסקאות של עד 50 ₪, שהצטברו יחד ל־${formatCurrency(
        smallExpensesTotal
      )}.`,
      value: formatCurrency(smallExpensesTotal),
      type:
        smallExpensesTotal >=
        currentMonthExpenseTotal * 0.2
          ? "warning"
          : "neutral",
    });
  }

  /*
   * 6. היום שבו הוצא הכי הרבה
   */
  const weekdayTotals = groupAmountsByKey(
    expenseSummaries,
    (expense) =>
      WEEKDAY_NAMES[
        getTransactionDate(expense.transaction).getDay()
      ],
    (expense) => expense.amount
  );

  const topWeekday = weekdayTotals[0];

  if (topWeekday && currentMonthExpenses.length >= 3) {
    const weekdayPercentage = Math.round(
      (topWeekday[1] / currentMonthExpenseTotal) * 100
    );

    insights.push({
      id: "top-spending-day",
      title: `${topWeekday[0]} הוא יום ההוצאות הבולט שלך`,
      description: `בחודש הנוכחי הוצאת בימי ${topWeekday[0].replace(
        "יום ",
        ""
      )} סכום כולל של ${formatCurrency(
        topWeekday[1]
      )}, שהם ${weekdayPercentage}% מההוצאות.`,
      value: formatCurrency(topWeekday[1]),
      type: "neutral",
    });
  }

  /*
   * 7. השבוע הנוכחי לעומת השבוע הקודם
   */
  if (weeklyChange !== null && weeklyChange !== 0) {
    const increased = weeklyChange > 0;

    insights.push({
      id: "weekly-expense-change",
      title: increased
        ? "קצב ההוצאות השבועי עלה"
        : "קצב ההוצאות השבועי ירד",
      description: increased
        ? `השבוע הוצאת ${formatPercentage(
            weeklyChange
          )} יותר מבשבוע הקודם.`
        : `השבוע הוצאת ${formatPercentage(
            weeklyChange
          )} פחות מבשבוע הקודם.`,
      value: `${increased ? "+" : "-"}${formatPercentage(
        weeklyChange
      )}`,
      type: increased ? "warning" : "positive",
    });
  }

  /*
   * 8. ממוצע לעסקה
   */
  if (currentMonthExpenses.length > 0) {
    const averageExpense =
      currentMonthExpenseTotal /
      currentMonthExpenses.length;

    insights.push({
      id: "average-expense",
      title: "ממוצע ההוצאה שלך לעסקה",
      description: `ביצעת החודש ${currentMonthExpenses.length.toLocaleString(
        "he-IL"
      )} הוצאות בסכום ממוצע של ${formatCurrency(
        averageExpense
      )} לעסקה.`,
      value: formatCurrency(averageExpense),
      type: "neutral",
    });
  }

  /*
   * 9. אחוז חיסכון
   */
  if (currentMonthIncomeTotal > 0) {
    const savingsRate = Math.round(
      (balance / currentMonthIncomeTotal) * 100
    );

    insights.push({
      id: "savings-rate",
      title:
        savingsRate >= 20
          ? "קצב החיסכון שלך חיובי"
          : savingsRate >= 0
            ? "נשאר חלק קטן מההכנסות"
            : "ההוצאות גבוהות מההכנסות",
      description:
        savingsRate >= 0
          ? `לאחר ההוצאות נשארו לך ${formatCurrency(
              balance
            )}, שהם ${savingsRate}% מההכנסות החודשיות.`
          : `הוצאת החודש ${formatCurrency(
              Math.abs(balance)
            )} יותר מסכום ההכנסות שנרשם.`,
      value: `${savingsRate}%`,
      type:
        savingsRate >= 20
          ? "positive"
          : savingsRate >= 0
            ? "neutral"
            : "negative",
    });
  }

  if (
    currentMonthIncomeTotal > 0 ||
    currentMonthExpenseTotal > 0
  ) {
    insights.push({
      id: "monthly-balance",
      title:
        balance >= 0
          ? "החודש נמצא במאזן חיובי"
          : "החודש נמצא במאזן שלילי",
      description:
        balance >= 0
          ? `ההכנסות גבוהות מההוצאות ב־${formatCurrency(
              balance
            )}.`
          : `ההוצאות גבוהות מההכנסות ב־${formatCurrency(
              Math.abs(balance)
            )}.`,
      value: formatCurrency(Math.abs(balance)),
      type: balance >= 0 ? "positive" : "negative",
    });
  }

  return insights;
}