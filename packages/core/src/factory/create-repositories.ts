import type { SupabaseClient } from '..'
import {
  SupabaseProfileRepository,
  SupabaseApplicationRepository,
  SupabasePracticeSessionRepository,
} from '..'
import type {
  ProfileRepository,
  ApplicationRepository,
  PracticeSessionRepository,
} from '..'

export interface Repositories {
  profile: ProfileRepository
  application: ApplicationRepository
  practiceSession: PracticeSessionRepository
}

/**
 * Create all repository instances with a Supabase client
 */
export function createRepositories(client: SupabaseClient): Repositories {
  return {
    profile: new SupabaseProfileRepository(client),
    application: new SupabaseApplicationRepository(client),
    practiceSession: new SupabasePracticeSessionRepository(client),
  }
}
