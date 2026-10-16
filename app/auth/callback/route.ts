import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { postAuthPath } from '@/utils/onboarding'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const dest = data.user ? await postAuthPath(supabase, data.user.id, next) : next
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
