import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { postAuthPath } from '@/utils/onboarding'

// Links in the auth emails (supabase/templates/*) point here instead of
// supabase.co, so the link domain matches the sender. The token hash is
// verified server-side and the session cookie is set on our own domain, so
// the link also works in a different browser from the one that asked for it.
// Google sign-in and the older ?code= links still go through /auth/callback.

const TYPES: EmailOtpType[] = ['signup', 'magiclink', 'email', 'recovery', 'email_change', 'invite']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      let dest: string
      switch (type) {
        case 'recovery':
        case 'invite':
          // Both need a (new) password before anything else.
          dest = '/reset-password'
          break
        case 'email_change':
          // With secure email change the first link only confirms one address.
          dest = data.user?.new_email ? '/profile/edit?email_change=pending' : '/profile/edit?email_change=done'
          break
        default:
          // signup / magiclink / email: consent, onboarding or the dashboard.
          dest = await postAuthPath(supabase, next)
      }
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalid`)
}
