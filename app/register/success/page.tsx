import { Suspense } from "react";
import RegisterSuccessContent from "./RegisterSuccessContent";

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-5"
        >
          <p className="text-sm text-[var(--color-text-secondary)]">
            טוען...
          </p>
        </main>
      }
    >
      <RegisterSuccessContent />
    </Suspense>
  );
}