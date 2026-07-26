"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";

type ChartTransaction = {
  amount: number | string;
  type: "expense" | "income";
  transaction_date: string;
};

type WeeklyOverviewChartProps = {
  transactions: ChartTransaction[];
};

type ChartItem = {
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: ChartItem;
  }>;
};

const weekdays = [
  "א׳",
  "ב׳",
  "ג׳",
  "ד׳",
  "ה׳",
  "ו׳",
  "ש׳",
];

function parseDate(value: string) {
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

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function isBetween(
  date: Date,
  start: Date,
  end: Date
) {
  return date >= start && date < end;
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("he-IL")} ₪`;
}

function WeeklyTooltip({
  active,
  payload,
}: TooltipProps) {
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

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-5">
          <span className="text-xs text-[var(--color-text-secondary)]">
            הכנסות
          </span>

          <span
            className="font-bold text-emerald-500"
            dir="ltr"
          >
            {formatCurrency(item.income)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="text-xs text-[var(--color-text-secondary)]">
            הוצאות
          </span>

          <span
            className="font-bold text-red-500"
            dir="ltr"
          >
            {formatCurrency(item.expense)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyOverviewChart({
  transactions,
}: WeeklyOverviewChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, -6);

    return Array.from({ length: 7 }, (_, index) => {
      const dayStart = addDays(startDate, index);
      const dayEnd = addDays(dayStart, 1);

      const dayTransactions = transactions.filter(
        (transaction) =>
          isBetween(
            parseDate(transaction.transaction_date),
            dayStart,
            dayEnd
          )
      );

      const income = dayTransactions
        .filter(
          (transaction) =>
            transaction.type === "income"
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0
        );

      const expense = dayTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense"
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0
        );

      return {
        label: weekdays[dayStart.getDay()],
        fullLabel: new Intl.DateTimeFormat("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(dayStart),
        income,
        expense,
      };
    });
  }, [transactions]);

  const weeklyIncome = chartData.reduce(
    (sum, item) => sum + item.income,
    0
  );

  const weeklyExpenses = chartData.reduce(
    (sum, item) => sum + item.expense,
    0
  );

  const hasData = chartData.some(
    (item) => item.income > 0 || item.expense > 0
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: 0.1,
      }}
      className="relative overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-7"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[var(--color-primary-light)] blur-3xl" />

      <div className="relative z-10">
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
                השבוע האחרון
              </p>
            </div>

            <h2 className="mt-3 text-xl font-black text-[var(--color-text)]">
              הכנסות והוצאות
            </h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-emerald-500/10 px-4 py-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <ArrowDownLeft size={17} />

              <span className="text-xs font-bold">
                הכנסות
              </span>
            </div>

            <p
              className="mt-2 text-xl font-black text-[var(--color-text)]"
              dir="ltr"
            >
              {formatCurrency(weeklyIncome)}
            </p>
          </div>

          <div className="rounded-[22px] bg-red-500/10 px-4 py-4">
            <div className="flex items-center gap-2 text-red-500">
              <ArrowUpRight size={17} />

              <span className="text-xs font-bold">
                הוצאות
              </span>
            </div>

            <p
              className="mt-2 text-xl font-black text-[var(--color-text)]"
              dir="ltr"
            >
              {formatCurrency(weeklyExpenses)}
            </p>
          </div>
        </div>

        {hasData ? (
          <div
            className="mt-6 h-[290px] w-full"
            dir="ltr"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 6,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="weeklyIncomeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#10b981"
                      stopOpacity={0.32}
                    />

                    <stop
                      offset="100%"
                      stopColor="#10b981"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="weeklyExpenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#ef4444"
                      stopOpacity={0.28}
                    />

                    <stop
                      offset="100%"
                      stopColor="#ef4444"
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

                <Tooltip
                  content={(props) => (
                    <WeeklyTooltip
                      active={props.active}
                      payload={props.payload?.map(
                        (item) => ({
                          payload:
                            item.payload as ChartItem,
                        })
                      )}
                    />
                  )}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#weeklyIncomeGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#ffffff",
                    stroke: "#10b981",
                    strokeWidth: 3,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#weeklyExpenseGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#ffffff",
                    stroke: "#ef4444",
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-6 text-center">
            <div>
              <p className="font-black text-[var(--color-text)]">
                אין תנועות בשבוע האחרון
              </p>

              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                לאחר שתוסיפי הכנסה או הוצאה, היא תופיע כאן.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}