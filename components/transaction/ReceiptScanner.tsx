"use client";

import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ReceiptScannerProps = {
  onAmountDetected: (amount: string) => void;
  onDateDetected: (date: string) => void;
  onMerchantDetected: (merchant: string) => void;
};

type ScanStatus =
  | "idle"
  | "loading"
  | "recognizing"
  | "success"
  | "error";

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/[״"'׳]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function extractAmount(text: string) {
  const normalized = normalizeText(text);

  const amountPattern =
    "(\\d{1,6}(?:[.,]\\d{1,2})?)";

  const priorityPatterns = [
    new RegExp(
      `סהכ\\s*כולל\\s*מעמ(?:\\s*\\(?שח\\)?)?[^\\d]{0,25}${amountPattern}`,
      "i"
    ),

    new RegExp(
      `${amountPattern}[^\\d]{0,25}סהכ\\s*כולל\\s*מעמ`,
      "i"
    ),

    new RegExp(
      `נתקבל\\s*סך\\s*של[^\\d]{0,25}${amountPattern}`,
      "i"
    ),

    new RegExp(
      `${amountPattern}[^\\d]{0,25}נתקבל\\s*סך\\s*של`,
      "i"
    ),

    new RegExp(
      `סכום\\s*לתשלום[^\\d]{0,25}${amountPattern}`,
      "i"
    ),

    new RegExp(
      `סהכ\\s*לתשלום[^\\d]{0,25}${amountPattern}`,
      "i"
    ),

    new RegExp(
      `grand\\s*total[^\\d]{0,25}${amountPattern}`,
      "i"
    ),

    new RegExp(
      `amount\\s*due[^\\d]{0,25}${amountPattern}`,
      "i"
    ),
  ];

  for (const pattern of priorityPatterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    /*
     * בחלק מהביטויים הסכום הוא match[1],
     * ובאחרים הוא עדיין match[1].
     */
    const amount = parseAmount(match[1]);

    if (amount !== null) {
      return amount.toFixed(2);
    }
  }

  /*
   * גיבוי: אוספים סכומים שמופיעים ליד ₪ / ש"ח / NIS.
   */
  const currencyPattern =
    /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:₪|שח|nis)/gi;

  const currencyAmounts: number[] = [];

  for (const match of normalized.matchAll(currencyPattern)) {
    const amount = parseAmount(match[1]);

    if (amount !== null) {
      currencyAmounts.push(amount);
    }
  }

  if (currencyAmounts.length > 0) {
    /*
     * בוחרים את הסכום שמופיע הכי הרבה פעמים במסמך.
     * בחשבוניות הסכום הסופי מופיע לעיתים בכמה מקומות.
     */
    const frequency = new Map<number, number>();

    for (const amount of currencyAmounts) {
      const rounded = Number(amount.toFixed(2));

      frequency.set(
        rounded,
        (frequency.get(rounded) ?? 0) + 1
      );
    }

    const mostFrequent = [...frequency.entries()].sort(
      (a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }

        return b[0] - a[0];
      }
    )[0]?.[0];

    if (mostFrequent !== undefined) {
      return mostFrequent.toFixed(2);
    }
  }

  /*
   * גיבוי אחרון: מספרים עשרוניים.
   */
  const decimalMatches = [
    ...normalized.matchAll(
      /\b(\d{1,6}[.,]\d{1,2})\b/g
    ),
  ];

  const amounts = decimalMatches
    .map((match) => parseAmount(match[1]))
    .filter(
      (amount): amount is number => amount !== null
    );

  if (amounts.length === 0) {
    return null;
  }

  const frequency = new Map<number, number>();

  for (const amount of amounts) {
    const rounded = Number(amount.toFixed(2));

    frequency.set(
      rounded,
      (frequency.get(rounded) ?? 0) + 1
    );
  }

  const mostFrequent = [...frequency.entries()].sort(
    (a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return b[0] - a[0];
    }
  )[0]?.[0];

  return mostFrequent !== undefined
    ? mostFrequent.toFixed(2)
    : null;
}

function formatDate(
  dayValue: string,
  monthValue: string,
  yearValue: string
) {
  const day = Number(dayValue);
  const month = Number(monthValue);
  let year = Number(yearValue);

  if (year < 100) {
    year += 2000;
  }

  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return [
    String(year),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function extractDate(text: string) {
  const normalized = normalizeText(text);

  /*
   * קודם מחפשים תאריך הפקת חשבונית,
   * כדי לא לבחור בטעות תאריך מתחילת תקופת החשבון.
   */
  const preferredPatterns = [
    /תאריך\s*הפקת\s*החשבונית[^\d]{0,20}(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/i,

    /תאריך\s*חשבונית[^\d]{0,20}(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/i,

    /invoice\s*date[^\d]{0,20}(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/i,
  ];

  for (const pattern of preferredPatterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const date = formatDate(
      match[1],
      match[2],
      match[3]
    );

    if (date) {
      return date;
    }
  }

  const genericMatch = normalized.match(
    /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/
  );

  if (!genericMatch) {
    return null;
  }

  return formatDate(
    genericMatch[1],
    genericMatch[2],
    genericMatch[3]
  );
}

function extractMerchant(text: string) {
  const ignoredWords = [
    "לכבוד",
    "חשבונית",
    "קבלה",
    "מקור",
    "העתק",
    "מספר לקוח",
    "מס חשבונית",
    "תאריך",
    "סהכ",
    "לתשלום",
    "חשבון לשירותי",
  ];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 3)
    .filter((line) => /[א-תA-Za-z]/.test(line))
    .filter((line) => {
      const normalizedLine = normalizeText(line);

      return !ignoredWords.some((word) =>
        normalizedLine.includes(normalizeText(word))
      );
    });

  return lines[0]?.slice(0, 60) ?? null;
}

async function extractTextFromPdf(
  file: File
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  const pagesText: string[] = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    /*
     * שומרים רווחים בין חלקי הטקסט.
     * אין צורך להמיר PDF לתמונה.
     */
    const pageText = content.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }

        return "";
      })
      .filter(Boolean)
      .join(" ");

    pagesText.push(pageText);
  }

  return pagesText.join("\n");
}

export default function ReceiptScanner({
  onAmountDetected,
  onDateDetected,
  onMerchantDetected,
}: ReceiptScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] =
    useState<ScanStatus>("idle");

  const [progress, setProgress] = useState(0);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setStatus("error");
      setMessage(
        "יש לבחור תמונה או קובץ PDF של חשבונית."
      );

      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    setStatus("loading");
    setProgress(0);
    setMessage("מכין את סריקת החשבונית...");

    let worker: Awaited<
      ReturnType<typeof createWorker>
    > | null = null;

    try {
      let text = "";

      /*
       * PDF: קוראים טקסט ישירות.
       * תמונה: משתמשים ב־Tesseract.
       */
      if (isPdf) {
        setMessage("קורא את קובץ ה־PDF...");
        setProgress(50);

        text = await extractTextFromPdf(file);

        setProgress(100);
      } else {
        worker = await createWorker("heb+eng", 1, {
          logger: (workerMessage) => {
            if (
              workerMessage.status ===
                "recognizing text" &&
              typeof workerMessage.progress === "number"
            ) {
              const currentProgress = Math.round(
                workerMessage.progress * 100
              );

              setStatus("recognizing");
              setProgress(currentProgress);
              setMessage(
                `קורא את החשבונית... ${currentProgress}%`
              );
            }
          },
        });

        const result = await worker.recognize(file);
        text = result.data.text;
      }

      console.log("RECEIPT TEXT:", text);

      const detectedAmount = extractAmount(text);
      const detectedDate = extractDate(text);
      const detectedMerchant =
        extractMerchant(text);

      console.log("DETECTED AMOUNT:", detectedAmount);
      console.log("DETECTED DATE:", detectedDate);
      console.log(
        "DETECTED MERCHANT:",
        detectedMerchant
      );

      if (detectedAmount) {
        onAmountDetected(detectedAmount);
      }

      if (detectedDate) {
        onDateDetected(detectedDate);
      }

      if (detectedMerchant) {
        onMerchantDetected(detectedMerchant);
      }

      if (
        !detectedAmount &&
        !detectedDate &&
        !detectedMerchant
      ) {
        setStatus("error");
        setMessage(
          "לא הצלחנו לזהות פרטים. אפשר למלא אותם ידנית."
        );

        return;
      }

      setStatus("success");
      setProgress(100);

      if (detectedAmount) {
        setMessage(
          `הסריקה הסתיימה. זוהה סכום של ${detectedAmount} ₪. יש לבדוק את הפרטים לפני השמירה.`
        );
      } else {
        setMessage(
          "הסריקה הסתיימה. יש לבדוק את הפרטים לפני השמירה."
        );
      }
    } catch (error) {
      console.error("Receipt scan error:", error);

      setStatus("error");
      setMessage(
        "לא הצלחנו לסרוק את הקובץ. נסי קובץ ברור יותר."
      );
    } finally {
      if (worker) {
        await worker.terminate();
      }

      event.target.value = "";
    }
  }

  return (
    <section className="rounded-[24px] border border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/40 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={(event) => void handleFile(event)}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-xl text-[var(--color-primary)]">
          📷
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-black text-[var(--color-text)]">
            סריקת חשבונית
          </h2>

          <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
            נזהה אוטומטית סכום, תאריך ושם עסק
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={
          status === "loading" ||
          status === "recognizing"
        }
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-surface)] px-4 text-sm font-black text-[var(--color-primary)] shadow-[var(--shadow-small)] transition hover:bg-[var(--color-primary-light)] disabled:cursor-wait disabled:opacity-60"
      >
        {status === "loading" ||
        status === "recognizing"
          ? "סורק חשבונית..."
          : "צילום או בחירת חשבונית"}
      </button>

      {(status === "loading" ||
        status === "recognizing") && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {message}
          </p>
        </div>
      )}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="תצוגה מקדימה של החשבונית"
          className="mt-4 max-h-48 w-full rounded-2xl border border-[var(--color-border)] object-contain"
        />
      )}

      {status === "success" && (
        <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-500">
          {message}
        </p>
      )}

      {status === "error" && (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
          {message}
        </p>
      )}
    </section>
  );
}