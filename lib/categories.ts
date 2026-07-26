import { createServerSupabaseClient } from "./supabase-server";

export async function getCategories(type: "expense" | "income") {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("type", type)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw error;
  }

  return data;
}