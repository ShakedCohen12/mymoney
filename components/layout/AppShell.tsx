"use client";

import { usePathname } from "next/navigation";

import BottomNavigation from "@/components/layout/BottomNavigation";

type AppShellProps = {
  children: React.ReactNode;
};

const pagesWithoutNavigation = [
  "/",
  "/login",
  "/register",
  "/auth",
];

function shouldHideNavigation(pathname: string) {
  return pagesWithoutNavigation.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  });
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const hideNavigation =
    shouldHideNavigation(pathname);

  return (
    <>
      <div className={hideNavigation ? "" : "pb-28"}>
        {children}
      </div>

      {!hideNavigation && <BottomNavigation />}
    </>
  );
}