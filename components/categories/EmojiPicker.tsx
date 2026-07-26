"use client";

const EMOJI_GROUPS = [
  { title: "אוכל", items: ["🍔", "🍕", "🥗", "🍣", "🍜", "☕", "🍰", "🛒"] },
  { title: "תחבורה", items: ["🚗", "🚕", "🚌", "🚆", "✈️", "🚲", "⛽", "🛵"] },
  { title: "קניות ובית", items: ["🛍️", "👕", "👟", "💄", "🏠", "🧾", "💡", "🛋️"] },
  { title: "כסף ועבודה", items: ["💰", "💵", "💳", "📈", "🏦", "🪙", "💼", "🧑‍💻"] },
  { title: "פנאי ובריאות", items: ["🎮", "🎬", "🎵", "⚽", "📚", "❤️", "🩺", "💊"] },
  { title: "אחר", items: ["🎁", "📦", "🐶", "🐱", "🌴", "🎓", "👶", "🔧"] },
];

type EmojiPickerProps = {
  value: string;
  onChange: (emoji: string) => void;
};

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="custom-emoji" className="block text-sm font-bold text-slate-700">
          אימוג׳י לבחירתך
        </label>
        <p className="mt-1 text-xs text-slate-500">
          אפשר לפתוח את מקלדת האימוג׳ים ולהקליד כל אימוג׳י שתרצי.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="custom-emoji"
            type="text"
            inputMode="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="למשל: 🧁"
            className="h-14 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-3xl outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
            {value.trim() || "📦"}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700">או בחרי מהרשימה</p>
        <div className="mt-3 space-y-4">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-bold text-slate-500">{group.title}</p>
              <div className="grid grid-cols-8 gap-2">
                {group.items.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onChange(emoji)}
                    className={`flex aspect-square items-center justify-center rounded-xl border text-xl transition hover:-translate-y-0.5 ${
                      value === emoji
                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                        : "border-slate-200 bg-white hover:border-violet-200"
                    }`}
                    aria-label={`בחירת האימוג׳י ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
