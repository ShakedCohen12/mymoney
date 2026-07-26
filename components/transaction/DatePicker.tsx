"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function MyDatePicker({
  value,
  onChange,
}: Props) {
  const selectedDate = value
    ? new Date(`${value}T12:00:00`)
    : new Date();

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[var(--color-text)]">
        תאריך
      </label>

      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (!date) {
            return;
          }

          const year = date.getFullYear();
          const month = String(
            date.getMonth() + 1
          ).padStart(2, "0");
          const day = String(date.getDate()).padStart(
            2,
            "0"
          );

          onChange(`${year}-${month}-${day}`);
        }}
        dateFormat="dd/MM/yyyy"
        calendarStartDay={0}
        className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-right font-semibold text-[var(--color-text)] caret-[var(--color-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]"
        wrapperClassName="w-full"
      />
    </div>
  );
}