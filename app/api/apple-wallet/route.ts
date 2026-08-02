import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type AppleWalletPayload = {
  token?: unknown;
  amount?: unknown;
  merchant?: unknown;
  name?: unknown;
  card?: unknown;
};

function cleanText(
  value: unknown,
  maxLength = 160
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function parseAmount(value: unknown): number | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const normalized = String(value)
    .replace(/[₪,\s]/g, "")
    .replace(/[^\d.-]/g, "");

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function createExternalKey({
  amount,
  merchant,
  name,
  card,
}: {
  amount: number;
  merchant: string | null;
  name: string | null;
  card: string | null;
}) {

  const minuteBucket = Math.floor(
    Date.now() / 60_000
  );

  return createHash("sha256")
    .update(
      JSON.stringify({
        amount,
        merchant,
        name,
        card,
        minuteBucket,
      })
    )
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as AppleWalletPayload;
      console.log("BODY:", body);
      console.log("AMOUNT TYPE:", typeof body.amount);
      console.log("AMOUNT VALUE:", body.amount);

    const token = cleanText(body.token, 300);
    const amount = parseAmount(body.amount);
    const merchant = cleanText(body.merchant);
    const transactionName = cleanText(body.name);
    const cardName = cleanText(body.card);

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing connection token.",
        },
        { status: 401 }
      );
    }

    if (amount === null) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid amount.",
        },
        { status: 400 }
      );
    }

    if (!merchant && !transactionName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Merchant or transaction name is required.",
        },
        { status: 400 }
      );
    }

    const supabase =
      createSupabaseAdminClient();

    const tokenHash = hashToken(token);

    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("wallet_connections")
      .select("id, user_id, is_active")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (connectionError) {
      throw connectionError;
    }

    if (!connection || !connection.is_active) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid or inactive connection.",
        },
        { status: 401 }
      );
    }

    const externalKey = createExternalKey({
      amount,
      merchant,
      name: transactionName,
      card: cardName,
    });

    const { data: existingImport } =
      await supabase
        .from("wallet_imports")
        .select("id")
        .eq("user_id", connection.user_id)
        .eq("external_key", externalKey)
        .maybeSingle();

    if (existingImport) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        importId: existingImport.id,
      });
    }

    const {
      data: walletImport,
      error: insertError,
    } = await supabase
      .from("wallet_imports")
      .insert({
        user_id: connection.user_id,
        amount,
        merchant,
        transaction_name: transactionName,
        card_name: cardName,
        source: "apple_wallet",
        status: "pending",
        external_key: externalKey,
        raw_payload: {
          amount: body.amount ?? null,
          merchant: body.merchant ?? null,
          name: body.name ?? null,
          card: body.card ?? null,
        },
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    await supabase
      .from("wallet_connections")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    return NextResponse.json({
      ok: true,
      duplicate: false,
      importId: walletImport.id,
    });
  } catch (error) {
    console.error(
      "Apple Wallet import error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not import the transaction.",
      },
      { status: 500 }
    );
  }
}