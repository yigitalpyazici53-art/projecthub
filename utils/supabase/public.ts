import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Cookie-less anon client for public reads (sitemap, metadata) so those
// routes stay cacheable instead of opting into dynamic rendering.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
