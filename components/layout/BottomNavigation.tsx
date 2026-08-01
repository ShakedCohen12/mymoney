// components/layout/BottomNavigation.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpDown,
  ChartNoAxesCombined,
  CircleDollarSign,
  House,
  Plus,
  Settings,
  Target,
} from "lucide-react";

const items = [
  {
    href: "/dashboard",
    label: "בית",
    icon: House,
  },
  {
    href: "/transactions",
    label: "תנועות",
    icon: ArrowUpDown,
  },
  {
    href: "/budgets",
    label: "תקציבים",
    icon: CircleDollarSign,
  },
  {
    href: "/transactions/new",
    label: "הוספה",
    icon: Plus,
    primary: true,
  },
  {
    href: "/goals",
    label: "יעדים",
    icon: Target,
  },
  {
    href: "/analytics",
    label: "ניתוח",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/profile",
    label: "הגדרות",
    icon: Settings,
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/transactions/new") {
    return pathname === "/transactions/new";
  }

  if (href === "/transactions") {
    return (
      pathname === "/transactions" ||
      (pathname.startsWith("/transactions/") &&
        !pathname.startsWith("/transactions/new"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      dir="rtl"
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl"
    >
      <div className="mx-auto grid h-[66px] max-w-2xl grid-cols-7 items-end gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item.href);

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex h-full min-w-0 flex-col items-center justify-end text-[var(--color-primary)]"
              >
                <span
                  className={`flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full text-white ring-4 ring-[var(--color-surface)] transition active:scale-95 ${
                    active
                      ? "bg-[var(--color-primary)] brightness-90"
                      : "bg-[var(--color-primary)]"
                  }`}
                  style={{
                    boxShadow:
                      "0 8px 24px color-mix(in srgb, var(--color-primary) 40%, transparent)",
                  }}
                >
                  <Icon size={28} strokeWidth={2.3} />
                </span>

                <span className="-mt-2 text-[10px] font-bold text-[var(--color-primary)]">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-full min-w-0 flex-col items-center justify-end gap-1 rounded-2xl pb-1 transition active:scale-95 ${
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-full transition ${
                  active
                    ? "bg-[var(--color-primary-light)]"
                    : "bg-transparent"
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.6 : 2} />
              </span>

              <span className="max-w-full truncate text-[10px] font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}