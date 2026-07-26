"use client";

import { motion } from "framer-motion";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type CategoryDataItem = {
  name: string;
  value: number;
  color: string;
};

type CategoryPieChartProps = {
  categoryData: CategoryDataItem[];
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: CategoryDataItem;
  }>;
};

function CustomTooltip({
  active,
  payload,
}: CustomTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-right shadow-[var(--shadow-medium)]">
      <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
        {item.name}
      </p>

      <p className="mt-1 text-lg font-bold text-[var(--color-text)]">
        {item.value.toLocaleString("he-IL")} ₪
      </p>
    </div>
  );
}

export default function CategoryPieChart({
  categoryData,
}: CategoryPieChartProps) {
  const total = categoryData.reduce(
    (sum, category) => sum + category.value,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            סך ההוצאות החודש
          </p>

          <h3 className="mt-1 text-3xl font-black tracking-tight text-[var(--color-text)]">
            {total.toLocaleString("he-IL")} ₪
          </h3>
        </div>

        <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)]">
          החודש
        </span>
      </div>

      {categoryData.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-3xl">
            📊
          </div>

          <p className="mt-4 font-bold text-[var(--color-text)]">
            עדיין אין הוצאות החודש
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            כשתשמרי הוצאה היא תופיע כאן
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="relative h-[290px] w-full"
            dir="ltr"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                  stroke="transparent"
                >
                  {categoryData.map((category) => (
                    <Cell
                      key={category.name}
                      fill={category.color}
                    />
                  ))}
                </Pie>

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                סה״כ הוצאות
              </p>

              <p className="mt-1 text-2xl font-black text-[var(--color-text)]">
                {total.toLocaleString("he-IL")} ₪
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3">
            {categoryData.map((category) => {
              const percentage =
                total > 0
                  ? Math.round(
                      (category.value / total) * 100
                    )
                  : 0;

              return (
                <div
                  key={category.name}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: category.color,
                      }}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--color-text)]">
                        {category.name}
                      </p>

                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        {percentage}% מההוצאות
                      </p>
                    </div>
                  </div>

                  <p
                    dir="ltr"
                    className="shrink-0 font-bold text-[var(--color-text)]"
                  >
                    {category.value.toLocaleString("he-IL")} ₪
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}