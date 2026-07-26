type StatCardProps = {
  title: string;
  amount: number;
  type?: "income" | "expense" | "balance";
};

const styles = {
  income: {
    label: "text-[var(--color-income)]",
    background: "bg-green-50",
    sign: "+",
  },
  expense: {
    label: "text-[var(--color-expense)]",
    background: "bg-red-50",
    sign: "-",
  },
  balance: {
    label: "text-[var(--color-primary)]",
    background: "bg-emerald-50",
    sign: "",
  },
};

export default function StatCard({
  title,
  amount,
  type = "balance",
}: StatCardProps) {
  const style = styles[type];

  const formattedAmount = new Intl.NumberFormat("he-IL").format(amount);

  return (
    <article
      className={`rounded-[var(--radius-large)] p-5 ${style.background}`}
    >
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">
        {title}
      </p>

      <p className={`mt-2 text-2xl font-bold ${style.label}`} dir="ltr">
        {style.sign}
        {formattedAmount} ₪
      </p>
    </article>
  );
}