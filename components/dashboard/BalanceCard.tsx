"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

type BalanceCardProps = {
  balance: number;
  income: number;
  expenses: number;
};

export default function BalanceCard({
  balance,
  income,
  expenses,
}: BalanceCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  return (
    <motion.section
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
    className="relative overflow-hidden rounded-[32px] bg-[var(--color-primary)] px-6 py-7 text-white shadow-[var(--shadow-medium)] sm:px-8 sm:py-9"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

     <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.15)_48%,transparent_72%)]" />

      <button
        type="button"
        onClick={() => setIsBalanceVisible((current) => !current)}
        className="absolute left-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg backdrop-blur-xl transition duration-200 hover:scale-105 hover:bg-white/20"
        aria-label={isBalanceVisible ? "הסתרת יתרה" : "הצגת יתרה"}
      >
        {isBalanceVisible ? "◉" : "○"}
      </button>

      <div className="relative z-10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-white/75">
            היתרה הזמינה שלך
          </p>

          <div className="mt-3 flex min-h-[64px] items-center justify-center">
            {isBalanceVisible ? (
              <AnimatedNumber
                value={balance}
                duration={1400}
                suffix=" ₪"
                className="text-4xl font-bold tracking-tight sm:text-5xl"
              />
            ) : (
              <span className="text-4xl font-bold tracking-[0.22em] sm:text-5xl">
                ••••••
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-white/65">
            מעודכן לרגע זה
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-[20px] border border-white/15 bg-white/10 p-4 text-center backdrop-blur-xl"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/70">
              <span className="text-base">↗</span>
              <span>הכנסות החודש</span>
            </div>

            <AnimatedNumber
              value={income}
              duration={1100}
              prefix="+"
              suffix=" ₪"
              className="mt-2 block text-lg font-bold sm:text-xl"
            />
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="rounded-[20px] border border-white/15 bg-white/10 p-4 text-center backdrop-blur-xl"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/70">
              <span className="text-base">↘</span>
              <span>הוצאות החודש</span>
            </div>

            <AnimatedNumber
              value={expenses}
              duration={1200}
              prefix="-"
              suffix=" ₪"
              className="mt-2 block text-lg font-bold sm:text-xl"
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}