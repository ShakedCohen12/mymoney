import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("חסרים פרטי החיבור ל-Supabase בקובץ .env.local");
  }

  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  );
}