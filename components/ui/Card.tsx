import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: CardPadding;
  hover?: boolean;
  clickable?: boolean;
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  padding = "md",
  hover = false,
  clickable = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-large)]",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        "shadow-[var(--shadow-small)]",
        "transition-all duration-200",
        paddingClasses[padding],
        hover && "hover:shadow-[var(--shadow-medium)]",
        clickable && "cursor-pointer active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}