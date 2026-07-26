"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartTransaction = {
  amount: number | string;
  type: "expense" | "income";
  transaction_date: string;
};

type SpendingChartProps = {
  transactions: ChartTransaction[];
};

type Period = "week" | "month" | "year";
type Metric = "expense" | "income" | "balance";

type ChartDataItem = {
  label: string;
  fullLabel: string;
  amount: number;
  income: number;
  expense: number;
  count: number;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: ChartDataItem;
  }>;
  metric: Metric;
};

const periodOptions: Array<{
  value: Period;
  label: string;
}> = [
  {
    value: "week",
    label: "שבוע",
  },
  {
    value: "month",
    label: "חודש",
  },
  {
    value: "year",
    label: "שנה",
  },
];

const metricOptions: Array<{
  value: Metric;
  label: string;
}> = [
  {
    value: "expense",
    label: "הוצאות",
  },
  {
    value: "income",
    label: "הכנסות",
  },
  {
    value: "balance",
    label: "מאזן",
  },
];

const shortWeekdays = [
  "א׳",
  "ב׳",
  "ג׳",
  "ד׳",
  "ה׳",
  "ו׳",
  "ש׳",
];

const monthNames = [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳",
];

function parseTransactionDate(value: string) {
  const dateOnlyMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  return new Date(value);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, numberOfDays: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);

  return result;
}

function isBetween(
  date: Date,
  startDate: Date,
  endDate: Date
) {
  return date >= startDate && date < endDate;
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("he-IL")} ₪`;
}

function getMetricTitle(metric: Metric) {
  if (metric === "income") {
    return "הכנסות";
  }

  if (metric === "balance") {
    return "מאזן";
  }

  return "הוצאות";
}

function getMetricValue(
  income: number,
  expense: number,
  metric: Metric
) {
  if (metric === "income") {
    return income;
  }

  if (metric === "balance") {
    return income - expense;
  }

  return expense;
}

function calculatePercentageChange(
  currentValue: number,
  previousValue: number
) {
  if (previousValue === 0) {
    return null;
  }

  return Math.round(
    ((currentValue - previousValue) /
      Math.abs(previousValue)) *
      100
  );
}

function getComparisonLabel(period: Period) {
  if (period === "week") {
    return "לעומת 7 הימים הקודמים";
  }

  if (period === "month") {
    return "לעומת התקופה המקבילה בחודש הקודם";
  }

  return "לעומת התקופה המקבילה בשנה הקודמת";
}

function buildWeekData(
  transactions: ChartTransaction[],
  metric: Metric,
  now: Date
) {
  const today = startOfDay(now);
  const currentStart = addDays(today, -6);
  const currentEnd = addDays(today, 1);

  const previousStart = addDays(currentStart, -7);
  const previousEnd = currentStart;

  const chartData: ChartDataItem[] = [];

  for (let index = 0; index < 7; index += 1) {
    const dayStart = addDays(currentStart, index);
    const dayEnd = addDays(dayStart, 1);

    const dayTransactions = transactions.filter(
      (transaction) => {
        const transactionDate = parseTransactionDate(
          transaction.transaction_date
        );

        return isBetween(
          transactionDate,
          dayStart,
          dayEnd
        );
      }
    );

    const income = dayTransactions
      .filter(
        (transaction) => transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    const expense = dayTransactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    chartData.push({
      label: shortWeekdays[dayStart.getDay()],
      fullLabel: new Intl.DateTimeFormat("he-IL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(dayStart),
      amount: getMetricValue(income, expense, metric),
      income,
      expense,
      count: dayTransactions.length,
    });
  }

  const previousTransactions = transactions.filter(
    (transaction) => {
      const transactionDate = parseTransactionDate(
        transaction.transaction_date
      );

      return isBetween(
        transactionDate,
        previousStart,
        previousEnd
      );
    }
  );

  const currentTotal = chartData.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const previousIncome = previousTransactions
    .filter(
      (transaction) => transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const previousExpense = previousTransactions
    .filter(
      (transaction) => transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  return {
    chartData,
    currentTotal,
    previousTotal: getMetricValue(
      previousIncome,
      previousExpense,
      metric
    ),
  };
}

function buildMonthData(
  transactions: ChartTransaction[],
  metric: Metric,
  now: Date
) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const currentStart = new Date(
    currentYear,
    currentMonth,
    1
  );

  const currentEnd = addDays(startOfDay(now), 1);

  const previousMonthDate = new Date(
    currentYear,
    currentMonth - 1,
    1
  );

  const previousStart = new Date(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
    1
  );

  const daysInPreviousMonth = new Date(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth() + 1,
    0
  ).getDate();

  const previousComparisonDay = Math.min(
    currentDay,
    daysInPreviousMonth
  );

  const previousEnd = new Date(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
    previousComparisonDay + 1
  );

  const chartData: ChartDataItem[] = [];

  for (let day = 1; day <= currentDay; day += 1) {
    const dayStart = new Date(
      currentYear,
      currentMonth,
      day
    );

    const dayEnd = addDays(dayStart, 1);

    const dayTransactions = transactions.filter(
      (transaction) =>
        isBetween(
          parseTransactionDate(
            transaction.transaction_date
          ),
          dayStart,
          dayEnd
        )
    );

    const income = dayTransactions
      .filter(
        (transaction) => transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    const expense = dayTransactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    chartData.push({
      label: String(day),
      fullLabel: new Intl.DateTimeFormat("he-IL", {
        day: "numeric",
        month: "long",
      }).format(dayStart),
      amount: getMetricValue(income, expense, metric),
      income,
      expense,
      count: dayTransactions.length,
    });
  }

  const previousTransactions = transactions.filter(
    (transaction) =>
      isBetween(
        parseTransactionDate(
          transaction.transaction_date
        ),
        previousStart,
        previousEnd
      )
  );


  const previousIncome = previousTransactions
    .filter(
      (transaction) => transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const previousExpense = previousTransactions
    .filter(
      (transaction) => transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  return {
    chartData,
    currentTotal: chartData.reduce(
      (sum, item) => sum + item.amount,
      0
    ),
    previousTotal: getMetricValue(
      previousIncome,
      previousExpense,
      metric
    ),
  };
}

function buildYearData(
  transactions: ChartTransaction[],
  metric: Metric,
  now: Date
) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentStart = new Date(currentYear, 0, 1);
  const currentEnd = addDays(startOfDay(now), 1);

  const previousStart = new Date(
    currentYear - 1,
    0,
    1
  );

  const previousEnd = new Date(
    currentYear - 1,
    currentMonth,
    now.getDate() + 1
  );

  const chartData: ChartDataItem[] = [];

  for (
    let month = 0;
    month <= currentMonth;
    month += 1
  ) {
    const monthStart = new Date(
      currentYear,
      month,
      1
    );

    const monthEnd =
      month === currentMonth
        ? currentEnd
        : new Date(currentYear, month + 1, 1);

    const monthTransactions = transactions.filter(
      (transaction) =>
        isBetween(
          parseTransactionDate(
            transaction.transaction_date
          ),
          monthStart,
          monthEnd
        )
    );

    const income = monthTransactions
      .filter(
        (transaction) => transaction.type === "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    const expense = monthTransactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    chartData.push({
      label: monthNames[month],
      fullLabel: new Intl.DateTimeFormat("he-IL", {
        month: "long",
        year: "numeric",
      }).format(monthStart),
      amount: getMetricValue(income, expense, metric),
      income,
      expense,
      count: monthTransactions.length,
    });
  }

  const previousTransactions = transactions.filter(
    (transaction) =>
      isBetween(
        parseTransactionDate(
          transaction.transaction_date
        ),
        previousStart,
        previousEnd
      )
  );


  const previousIncome = previousTransactions
    .filter(
      (transaction) => transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const previousExpense = previousTransactions
    .filter(
      (transaction) => transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  return {
    chartData,
    currentTotal: chartData.reduce(
      (sum, item) => sum + item.amount,
      0
    ),
    previousTotal: getMetricValue(
      previousIncome,
      previousExpense,
      metric
    ),
  };
}

function ChartTooltip({
  active,
  payload,
  metric,
}: ChartTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="min-w-44 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-right shadow-xl"
    >
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
        {item.fullLabel}
      </p>

      <p
        className="mt-1 text-lg font-black text-[var(--color-text)]"
        dir="ltr"
      >
        {formatCurrency(item.amount)}
      </p>

      <div className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-secondary)]">
        {metric === "balance" && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span>הכנסות</span>
              <span dir="ltr">
                {formatCurrency(item.income)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span>הוצאות</span>
              <span dir="ltr">
                {formatCurrency(item.expense)}
              </span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-4">
          <span>מספר תנועות</span>
          <span>
            {item.count.toLocaleString("he-IL")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SpendingChart({
  transactions,
}: SpendingChartProps) {
  const [period, setPeriod] =
    useState<Period>("month");

  const [metric, setMetric] =
    useState<Metric>("expense");

  const chartSummary = useMemo(() => {
    const now = new Date();

    if (period === "week") {
      return buildWeekData(
        transactions,
        metric,
        now
      );
    }

    if (period === "year") {
      return buildYearData(
        transactions,
        metric,
        now
      );
    }

    return buildMonthData(
      transactions,
      metric,
      now
    );
  }, [transactions, period, metric]);

  const percentageChange = calculatePercentageChange(
    chartSummary.currentTotal,
    chartSummary.previousTotal
  );

  const hasChartValues = chartSummary.chartData.some(
    (item) => item.amount !== 0
  );

  const changeIsPositive =
    percentageChange !== null &&
    percentageChange > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.65,
        delay: 0.12,
      }}
      className="relative mt-6 overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-7"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[var(--color-primary-light)] blur-3xl" />

      <div className="relative z-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  <BarChart3
                    size={18}
                    strokeWidth={2.3}
                  />
                </div>

                <p className="text-sm font-bold text-[var(--color-primary)]">
                  ניתוח תנועות
                </p>
              </div>

              <p className="mt-3 text-xl font-black text-[var(--color-text)]">
                {getMetricTitle(metric)}
              </p>

              <p
                className="mt-1 text-3xl font-black tracking-tight text-[var(--color-text)]"
                dir="ltr"
              >
                {formatCurrency(
                  chartSummary.currentTotal
                )}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {percentageChange !== null && (
                  <>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        changeIsPositive
                          ? "text-emerald-500"
                          : percentageChange < 0
                            ? "text-red-500"
                            : "text-[var(--color-text-secondary)]"
                      }`}
                      dir="ltr"
                    >
                      {changeIsPositive ? (
                        <ArrowUpRight size={15} />
                      ) : percentageChange < 0 ? (
                        <ArrowDownRight size={15} />
                      ) : null}

                      {percentageChange > 0 ? "+" : ""}
                      {percentageChange}%
                    </span>

                    <span className="text-[var(--color-text-secondary)]">
                      {getComparisonLabel(period)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setPeriod(option.value)
                  }
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    period === option.value
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex w-fit rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
            {metricOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setMetric(option.value)
                }
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  metric === option.value
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {hasChartValues ? (
          <div
            className="mt-7 h-[245px] w-full"
            dir="ltr"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartSummary.chartData}
                margin={{
                  top: 12,
                  right: 6,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="realSpendingGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.38}
                    />

                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="4 5"
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={
                    period === "month" ? 18 : 8
                  }
                  tick={{
                    fill: "var(--color-text-secondary)",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(value: number) =>
                    Math.abs(value) >= 1000
                      ? `${(
                          value / 1000
                        ).toLocaleString("he-IL", {
                          maximumFractionDigits: 1,
                        })}K`
                      : value.toLocaleString("he-IL")
                  }
                  tick={{
                    fill: "var(--color-text-secondary)",
                    fontSize: 11,
                  }}
                />

                {metric === "balance" && (
                  <ReferenceLine
                    y={0}
                    stroke="var(--color-text-secondary)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                )}

                <Tooltip
                  cursor={{
                    stroke:
                      "var(--color-primary)",
                    strokeOpacity: 0.25,
                    strokeWidth: 2,
                  }}
                  content={(props) => (
                    <ChartTooltip
                      active={props.active}
                      metric={metric}
                      payload={props.payload?.map(
                        (item) => ({
                          payload:
                            item.payload as ChartDataItem,
                        })
                      )}
                    />
                  )}
                />

                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fill="url(#realSpendingGradient)"
                  connectNulls
                  activeDot={{
                    r: 6,
                    fill: "var(--color-surface)",
                    stroke:
                      "var(--color-primary)",
                    strokeWidth: 3,
                  }}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-7 flex min-h-[245px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <BarChart3 size={23} />
            </div>

            <p className="mt-4 font-black text-[var(--color-text)]">
              אין נתונים להצגה
            </p>


            <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]">
              לא נמצאו {getMetricTitle(metric)} בתקופה
              שבחרת.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}