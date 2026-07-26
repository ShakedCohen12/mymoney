import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import AccentProvider from "@/components/providers/AccentProvider";
import AppShell from "@/components/layout/AppShell";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyMoney",
  description: "ניהול הכסף שלך בצורה חכמה ופשוטה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${heebo.variable} antialiased`}>
        <ThemeProvider>
          <AccentProvider>
          <AppShell>{children}</AppShell>
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}