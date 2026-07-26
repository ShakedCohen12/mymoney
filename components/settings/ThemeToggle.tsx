"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="rounded-xl bg-violet-600 px-4 py-2 text-white"
    >
      {theme === "dark" ? "☀️ מצב בהיר" : "🌙 מצב כהה"}
    </button>
  );
}