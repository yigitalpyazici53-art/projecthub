import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { POLICY_VERSION } from '@/utils/legal'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/projects/new',
  '/profile',
  '/connections',
  '/messages',
  '/onboarding',
  '/consent',
]

// What a signed-in account that hasn't confirmed 18+ and the current policies
// may still open: the policies, the confirmation screen, auth flows and
// account deletion. Everything else redirects to /consent.
const CONSENT_EXEMPT = [
  '/consent',
  '/privacy',
  '/terms',
  '/kvkk',
  '/cookies',
  '/contact',
  '/login',
  '/signup',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/api/account/delete',
  '/api/unsubscribe',
]

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

// Files and generated metadata (robots.txt, sitemap.xml, opengraph-image…).
const isAsset = (pathname: string) =>
  /\.[a-z0-9]+$/i.test(pathname) || /\/(opengraph|twitter)-image/.test(pathname) || pathname.startsWith('/icon')

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refreshes the session cookie if expired. Required for Server Components.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = matches(pathname, PROTECTED_PREFIXES)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && !matches(pathname, CONSENT_EXEMPT) && !isAsset(pathname)) {
    const { data } = await supabase.rpc('my_profile_settings').maybeSingle()
    // No profile row yet (trigger lag): let the page's own fallback run.
    const needsConsent = data ? !data.is_seed && data.policy_version !== POLICY_VERSION : false
    if (needsConsent) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'consent_required' }, { status: 403 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/consent'
      url.search = ''
      url.searchParams.set('next', pathname + request.nextUrl.search)
      const redirect = NextResponse.redirect(url)
      // Keep any refreshed session cookies.
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
      return redirect
    }
  }

  return response
}
