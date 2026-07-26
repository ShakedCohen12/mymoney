import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  href?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",

  secondary:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:opacity-90",

  danger:
    "bg-[var(--color-expense)] text-white hover:opacity-90",

  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-sm rounded-xl",
  md: "min-h-12 px-5 text-base rounded-2xl",
  lg: "min-h-14 px-6 text-lg rounded-2xl",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = true,
  href,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center font-semibold transition-all duration-200",
    "active:scale-95",
    "focus:outline-none focus:ring-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
    fullWidth ? "w-full" : "w-auto",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}