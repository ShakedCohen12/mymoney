"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AccentColor =
  | "purple"
  | "blue"
  | "green"
  | "pink"
  | "orange";

type AccentContextValue = {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
};

const DEFAULT_ACCENT: AccentColor = "purple";
const STORAGE_KEY = "mymoney-accent";

const validAccents: AccentColor[] = [
  "purple",
  "blue",
  "green",
  "pink",
  "orange",
];

const AccentContext =
  createContext<AccentContextValue | null>(null);

function isAccentColor(value: string | null): value is AccentColor {
  return (
    value !== null &&
    validAccents.includes(value as AccentColor)
  );
}

export default function AccentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [accent, setAccentState] =
    useState<AccentColor>(DEFAULT_ACCENT);

  const applyAccent = useCallback((nextAccent: AccentColor) => {
    document.documentElement.setAttribute(
      "data-accent",
      nextAccent
    );
  }, []);

  useEffect(() => {
    const savedAccent =
      window.localStorage.getItem(STORAGE_KEY);

    const initialAccent = isAccentColor(savedAccent)
      ? savedAccent
      : DEFAULT_ACCENT;

    setAccentState(initialAccent);
    applyAccent(initialAccent);
  }, [applyAccent]);

  const setAccent = useCallback(
    (nextAccent: AccentColor) => {
      setAccentState(nextAccent);

      window.localStorage.setItem(
        STORAGE_KEY,
        nextAccent
      );

      applyAccent(nextAccent);
    },
    [applyAccent]
  );

  return (
    <AccentContext.Provider
      value={{
        accent,
        setAccent,
      }}
    >
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  const context = useContext(AccentContext);

  if (!context) {
    throw new Error(
      "useAccent must be used inside AccentProvider"
    );
  }

  return context;
}