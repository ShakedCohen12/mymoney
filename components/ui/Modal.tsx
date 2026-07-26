"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: "sm" | "md" | "lg";
}

const widths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  maxWidth = "md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={clsx(
          "w-full rounded-[var(--radius-large)] bg-[var(--color-surface)] shadow-[var(--shadow-large)]",
          widths[maxWidth]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
            <button
              onClick={onClose}
              className="text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold">
              {title}
            </h2>

            <div className="w-6" />
          </div>
        )}

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}