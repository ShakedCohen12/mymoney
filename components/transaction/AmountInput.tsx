"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function AmountInput({
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[var(--color-text)]">
        סכום
      </label>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-16 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-5 pl-14 text-3xl font-black text-[var(--color-text)] caret-[var(--color-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]"
        />

        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--color-text-secondary)]">
          ₪
        </span>
      </div>
    </div>
  );
}