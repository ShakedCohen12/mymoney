"use client";

import { motion } from "framer-motion";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function CategorySelector({
  categories,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-[var(--color-text)]">
        קטגוריה
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => {
          const selected = selectedId === category.id;

          return (
            <motion.button
              key={category.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(category.id)}
              aria-pressed={selected}
              className={`rounded-2xl border p-4 text-center transition-all ${
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-[var(--shadow-small)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/40"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    backgroundColor: `${category.color}20`,
                  }}
                >
                  {category.icon}
                </div>

                <span
                  className={`font-bold ${
                    selected
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text)]"
                  }`}
                >
                  {category.name}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}