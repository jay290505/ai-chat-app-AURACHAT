import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware for Supabase Auth protection.
 * Protects /admin, /chat, and /profile routes.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response; // Skip in demo mode or if not configured
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 1. Admin route protection
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    // Role check disabled — any authenticated user can access admin
  }

  // 2. Chat / Profile route protection (authenticated only)
  if (!user && (url.pathname.startsWith('/chat') || url.pathname.startsWith('/profile'))) {
    if (url.pathname === '/signin' || url.pathname === '/signup') return response;
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // 3. Redirect logged-in users away from auth pages
  if (user && (url.pathname === '/signin' || url.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     * - auth/callback (OAuth exchange must complete before session exists)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
