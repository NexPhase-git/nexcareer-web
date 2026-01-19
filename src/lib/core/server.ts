import { createClient } from '@/lib/supabase/server'
import { createNexCareerCore } from '@nexcareer/core'

/**
 * Create NexCareer Core instance for server-side usage (API routes)
 */
export async function getServerCore() {
  const supabase = await createClient()
  return createNexCareerCore({
    supabaseClient: supabase as never,
    groqApiKey: process.env.GROQ_API_KEY || '',
  })
}
