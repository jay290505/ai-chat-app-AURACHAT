/**
 * app/api/create-dummy-user/route.ts
 * ------------------------------------
 * DEVELOPMENT ONLY — creates a fixed demo account via the Supabase
 * Admin API (server-side, bypasses rate limits and email confirmation).
 *
 * DELETE this file before deploying to production.
 *
 * Call: GET http://localhost:3000/api/create-dummy-user
 */

import { NextResponse } from "next/server";

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
  }

  const EMAIL     = "demo@aura.app";
  const PASSWORD  = "Demo@1234";
  const FULL_NAME = "Demo User";
  const USERNAME  = "demo_user";

  /* ── 1. Create / update auth user ────────────────────────────────────── */
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { 
        full_name: FULL_NAME, 
        username: USERNAME,
        role: 'admin'
      },
    }),
  });

  const createData = await createRes.json();

  if (!createRes.ok) {
    // If already exists (422), that's fine — just move on
    if (createRes.status !== 422) {
      return NextResponse.json(
        { error: "Auth user creation failed", detail: createData },
        { status: createRes.status }
      );
    }
  }

  /* ── Extract user id ─────────────────────────────────────────────────── */
  let userId = createData?.id as string | undefined;

  // If already existed, fetch the user by email
  if (!userId) {
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(EMAIL)}`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    const listData = await listRes.json();
    userId = listData?.users?.[0]?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Could not determine user ID" }, { status: 500 });
  }

  /* ── 2. Upsert profiles row ──────────────────────────────────────────── */
  await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: userId,
      username: USERNAME,
      full_name: FULL_NAME,
      avatar_url: null,
      bio: "Demo account for testing Aura Messenger.",
      is_online: false,
    }),
  });

  return NextResponse.json({
    success: true,
    email: EMAIL,
    password: PASSWORD,
    userId,
    message: "Dummy account is ready. Use the credentials above to sign in.",
  });
}
