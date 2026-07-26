import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}

      <input
        {...props}
        className={clsx(
          "w-full rounded-[var(--radius-medium)]",
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface)]",
          "px-4 py-3",
          "text-[var(--color-text)]",
          "placeholder:text-[var(--color-text-secondary)]",
          "transition-all duration-200",
          "focus:border-[var(--color-primary)]",
          "focus:outline-none focus:ring-2 focus:ring-green-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />

      {error && (
        <p className="mt-2 text-sm text-[var(--color-expense)]">
          {error}
        </p>
      )}
    </div>
  );
}