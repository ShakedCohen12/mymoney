"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type DeleteTransactionButtonProps = {
  transactionId: string;
  transactionName: string;
  transactionAmount: number;
  transactionType: "income" | "expense";
};

export default function DeleteTransactionButton({
  transactionId,
  transactionName,
  transactionAmount,
  transactionType,
}: DeleteTransactionButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("לא נמצא משתמש מחובר");
      }

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setIsOpen(false);

      router.refresh();
    } catch (error) {
      console.error("Delete transaction error:", error);

      setErrorMessage(
        "לא הצלחנו למחוק את התנועה. נסי שוב."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage("");
          setIsOpen(true);
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="מחיקת תנועה"
        title="מחיקת תנועה"
      >
        🗑️
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/45 px-5 py-8 backdrop-blur-sm"
          onMouseDown={() => {
            if (!isDeleting) {
              setIsOpen(false);
            }
          }}
        >
          <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-[390px] rounded-[30px] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              🗑️
            </div>

            <div className="mt-5 text-center">
              <h2
                id="delete-dialog-title"
                className="text-xl font-bold text-slate-950"
              >
                למחוק את התנועה?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                התנועה תימחק לצמיתות ולא ניתן יהיה לשחזר אותה.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {transactionName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {transactionType === "expense"
                      ? "הוצאה"
                      : "הכנסה"}
                  </p>
                </div>

                <p
                  dir="ltr"
                  className={
                    transactionType === "expense"
                      ? "shrink-0 font-bold text-red-600"
                      : "shrink-0 font-bold text-emerald-600"
                  }
                >
                  {transactionType === "expense" ? "-" : "+"}
                  {transactionAmount.toLocaleString("he-IL")} ₪
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="h-12 rounded-2xl bg-slate-100 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-12 rounded-2xl bg-red-600 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "מוחק..." : "מחק תנועה"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}