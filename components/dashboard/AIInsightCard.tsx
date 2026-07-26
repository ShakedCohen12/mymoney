"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CircleAlert,
  PiggyBank,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import type { FinancialInsight } from "@/lib/insights";

type AIInsightCardProps = {
  insight?: FinancialInsight | null;
};

function getInsightIcon(id: string) {
  switch (id) {
    case "monthly-expense-change":
    case "weekly-expense-change":
      return TrendingUp;

    case "top-category":
    case "top-subcategory":
      return WalletCards;

    case "weekly-transactions":
    case "average-expense":
      return ReceiptText;

    case "largest-expense":
    case "small-expenses":
      return CircleAlert;

    case "savings-rate":
      return PiggyBank;

    case "monthly-balance":
      return TrendingDown;

    case "top-spending-day":
      return Sparkles;

    default:
      return Sparkles;
  }
}
function getInsightClasses(type: FinancialInsight["type"]) {
  if (type === "positive") {
    return {
      icon: "bg-emerald-500/10 text-emerald-500",
      value: "text-emerald-500",
    };
  }

  if (type === "negative") {
    return {
      icon: "bg-red-500/10 text-red-500",
      value: "text-red-500",
    };
  }

  if (type === "warning") {
    return {
      icon: "bg-amber-500/10 text-amber-500",
      value: "text-amber-500",
    };
  }

  return {
    icon: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    value: "text-[var(--color-primary)]",
  };
}

export default function AIInsightCard({
  insight,
}: AIInsightCardProps) {
  const Icon = insight ? getInsightIcon(insight.id) : Sparkles;

  const classes = insight
    ? getInsightClasses(insight.type)
    : {
        icon: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
        value: "text-[var(--color-primary)]",
      };

return (
  <motion.section
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.65,
      delay: 0.22,
    }}
    className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-7"
  >
    <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[var(--color-primary-light)] blur-3xl" />

    <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[var(--color-primary-light)] blur-3xl" />

    <div className="relative z-10 flex h-full flex-col">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg">
            <Sparkles size={22} strokeWidth={2.3} />
          </div>

          <div>
            <p className="text-sm font-bold text-[var(--color-primary)]">
              MyMoney AI
            </p>

            <h2 className="text-lg font-black text-[var(--color-text)]">
              תובנה חכמה בשבילך
            </h2>
          </div>
        </div>

        {insight && (
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            מעודכן
          </span>
        )}
      </div>

      <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-background)] p-5">
        {insight ? (
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${classes.icon}`}
            >
              <Icon size={19} strokeWidth={2.4} />
            </div>

            <div className="min-w-0 flex-1 text-right">
              <p className="text-base font-black leading-7 text-[var(--color-text)]">
                {insight.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {insight.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Sparkles size={20} />
            </div>

            <p className="mt-3 font-black text-[var(--color-text)]">
              עדיין אין מספיק נתונים
            </p>

            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              הוסיפי תנועות כדי לקבל תובנות אישיות.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 pt-8">
        <p className="text-xs font-semibold text-[var(--color-primary)] opacity-70">
          מבוסס על הנתונים שלך
        </p>

        <Link
          href={insight ? "/insights" : "/transactions/new"}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.03]"
        >
          {insight ? "לכל התובנות" : "הוספת תנועה"}

          <ArrowLeft size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  </motion.section>
);
}