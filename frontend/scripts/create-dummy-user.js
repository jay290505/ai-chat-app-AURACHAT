/**
 * create-dummy-user.js
 * Run: node scripts/create-dummy-user.js
 */

const SUPABASE_URL       = "https://mrxdqmkrynxhvepiolna.supabase.co";
const SERVICE_ROLE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZHFta3J5bnhodmVwaW9sbmEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzczNTQzOTA4LCJleHAiOjIwODkxMTk5MDh9.IUqMAxxv08iCePwQtfcIaiQ8pTpS9mG3QjYecGmsoHI";

const EMAIL    = "demo@aura.app";
const PASSWORD = "Demo@1234";
const FULL_NAME = "Demo User";
const USERNAME  = "demo_user";

async function main() {
  console.log("Creating dummy user…");

  // 1. Create the auth user
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,          // skip confirmation email
      user_metadata: {
        full_name: FULL_NAME,
        username: USERNAME,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Failed to create user:", data);
    process.exit(1);
  }

  const userId = data.id;
  console.log("✅ Auth user created:", userId);

  // 2. Upsert a row in the profiles table
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: userId,
      username: USERNAME,
      full_name: FULL_NAME,
      avatar_url: null,
      bio: "I am a demo user for testing Aura Messenger.",
      is_online: false,
    }),
  });

  if (!profileRes.ok) {
    const profileErr = await profileRes.json();
    console.warn("⚠️  Profile upsert warning (may already exist):", profileErr);
  } else {
    console.log("✅ Profile row upserted.");
  }

  console.log("\n──────────────────────────────");
  console.log("  Dummy account ready!");
  console.log("  Email   :", EMAIL);
  console.log("  Password:", PASSWORD);
  console.log("──────────────────────────────\n");
}

main().catch(console.error);
