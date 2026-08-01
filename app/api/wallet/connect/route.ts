import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST() {
  try {
    const supabase =
      await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "צריך להתחבר לחשבון.",
        },
        { status: 401 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const admin =
      createSupabaseAdminClient();
    const { error: disableError } = await admin
      .from("wallet_connections")
      .update({
        is_active: false,
      })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (disableError) {
      throw disableError;
    }

    const {
      data: connection,
      error: insertError,
    } = await admin
      .from("wallet_connections")
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        is_active: true,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      ok: true,
      connectionId: connection.id,
      createdAt: connection.created_at,
      token,
    });
  } catch (error) {
    console.error(
      "Wallet connection creation error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "לא הצלחנו ליצור את החיבור.",
      },
      { status: 500 }
    );
  }
}