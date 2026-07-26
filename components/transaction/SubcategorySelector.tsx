"use client";

export type Subcategory = {
  id: string;
  name: string;
};

type Props = {
  subcategories: Subcategory[];
  value: string | null;
  onChange: (value: string) => void;
  onAddNew: () => void;
};

export default function SubcategorySelector({
  subcategories,
  value,
  onChange,
  onAddNew,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[var(--color-text)]">
        תת־קטגוריה
      </label>

      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
      >
        <option
          value=""
          className="bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
        >
          בחר תת־קטגוריה
        </option>

        {subcategories.map((subcategory) => (
          <option
            key={subcategory.id}
            value={subcategory.id}
            className="bg-[var(--color-surface)] text-[var(--color-text)]"
          >
            {subcategory.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onAddNew}
        className="text-sm font-semibold text-[var(--color-primary)] transition hover:opacity-80"
      >
        + הוסף תת־קטגוריה
      </button>
    </div>
  );
}