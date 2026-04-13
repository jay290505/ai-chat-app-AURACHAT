/**
 * app/auth/callback/route.ts
 * ---------------------------
 * Server-side Route Handler for the Supabase OAuth PKCE callback.
 *
 * Why a Route Handler instead of a Client Component?
 *  - `createBrowserClient` has `detectSessionInUrl: true` by default, which
 *    automatically exchanges the PKCE code on the client. Manually calling
 *    `exchangeCodeForSession` in a useEffect races against this and fails with
 *    "PKCE code verifier not found in storage" because the verifier was already
 *    consumed by the automatic exchange.
 *  - Running the exchange server-side (here) avoids the race entirely.
 *  - The PKCE verifier stored in cookies by `createBrowserClient` is accessible
 *    to `createServerClient` because both read/write the same cookie jar.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/chat";

  // Surface OAuth provider-level errors (e.g. user denied consent)
  if (errorParam) {
    const msg = encodeURIComponent(errorDescription ?? errorParam);
    return NextResponse.redirect(`${origin}/signin?error=${msg}`);
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // setAll may throw in middleware — safe to ignore here
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful exchange — redirect to the destination
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // In dev, always use origin to avoid http/https mismatch
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    console.error("[auth/callback] Code exchange failed:", error.message);
  }

  // No code or exchange failed
  return NextResponse.redirect(`${origin}/signin?error=callback_failed`);
}
