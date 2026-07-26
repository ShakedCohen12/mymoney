import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 py-10"
    >
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14532D] text-2xl font-bold text-white">
            ₪
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#111827]">MyMoney</h1>
            <p className="text-sm text-[#6B7280]">ניהול כסף חכם ופשוט</p>
          </div>
        </div>

        <div className="mb-10">
          <p className="mb-3 text-sm font-medium text-[#22C55E]">
            ברוכים הבאים
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#111827]">
            הכסף שלך.
            <br />
            בשליטה שלך.
          </h2>

          <p className="mt-4 text-base leading-7 text-[#6B7280]">
            מנהלים הכנסות, הוצאות ותקציבים במקום אחד, בצורה פשוטה וברורה.
          </p>
        </div>

        <div className="space-y-3">
<Button href="/login">
  התחברות
</Button>

<Button href="/register" variant="secondary">
  פתיחת חשבון חדש
</Button>
        </div>
      </section>
    </main>
  );
}