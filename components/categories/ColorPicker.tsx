"use client";

const COLORS = [
  "#8B5CF6", "#6D28D9", "#3B82F6", "#06B6D4", "#10B981",
  "#16A34A", "#F59E0B", "#F97316", "#EF4444", "#EC4899", "#64748B", "#0F172A",
];

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-700">צבע הקטגוריה</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-10 w-10 rounded-full border-4 transition hover:scale-110 ${
              value === color
                ? "border-slate-900"
                : "border-white shadow ring-1 ring-slate-200"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`בחירת הצבע ${color}`}
          />
        ))}
      </div>
    </div>
  );
}
