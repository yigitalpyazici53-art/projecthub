import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { postAuthPath } from '@/utils/onboarding'
import { POLICY_VERSION } from '@/utils/legal'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Google sign-up from /signup: the 18+ and policy boxes were ticked there.
      if (data.user && searchParams.get('consent') === '1') {
        await supabase.rpc('record_consent', { p_version: POLICY_VERSION, p_source: 'oauth' })
      }
      const dest = data.user ? await postAuthPath(supabase, next) : next
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
