"use client";

type TransactionType = "expense" | "income";

type Props = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
};

export default function TransactionTypeSwitch({
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[var(--color-text)]">
        סוג תנועה
      </label>

      <div className="grid grid-cols-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-1">
        <button
          type="button"
          onClick={() => onChange("expense")}
          aria-pressed={value === "expense"}
          className={`rounded-xl py-3 text-sm font-black transition ${
            value === "expense"
              ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-small)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          הוצאה
        </button>

        <button
          type="button"
          onClick={() => onChange("income")}
          aria-pressed={value === "income"}
          className={`rounded-xl py-3 text-sm font-black transition ${
            value === "income"
              ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-small)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          הכנסה
        </button>
      </div>
    </div>
  );
}