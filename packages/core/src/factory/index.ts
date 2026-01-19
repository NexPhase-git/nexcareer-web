export * from './create-repositories'
export * from './create-services'
export * from './create-use-cases'

import type { SupabaseClient, PDFParserService } from '..'
import { createRepositories, type Repositories } from './create-repositories'
import { createServices, type Services, type ServicesConfig } from './create-services'
import { createUseCases, type UseCases } from './create-use-cases'

export interface NexCareerCore {
  repositories: Repositories
  services: Services
  useCases: UseCases
}

export interface CreateNexCareerCoreOptions {
  supabaseClient: SupabaseClient
  groqApiKey: string
  groqModel?: string
  pdfParser?: PDFParserService
}

/**
 * Create the complete NexCareer core with all dependencies wired up
 *
 * @example
 * ```ts
 * // In Next.js server component or API route
 * import { createClient } from '@/lib/supabase/server'
 * import { createNexCareerCore } from '@nexcareer/core'
 *
 * const supabase = await createClient()
 * const core = createNexCareerCore({
 *   supabaseClient: supabase,
 *   groqApiKey: process.env.GROQ_API_KEY!,
 * })
 *
 * const { applications } = await core.useCases.getApplications.execute({
 *   userId: user.id,
 * })
 * ```
 */
export function createNexCareerCore(options: CreateNexCareerCoreOptions): NexCareerCore {
  const { supabaseClient, groqApiKey, groqModel, pdfParser } = options

  const repositories = createRepositories(supabaseClient)

  const servicesConfig: ServicesConfig = {
    groqApiKey,
    groqModel,
  }

  const services = createServices(supabaseClient, servicesConfig)

  const useCases = createUseCases({
    repositories,
    services,
    pdfParser,
  })

  return {
    repositories,
    services,
    useCases,
  }
}
