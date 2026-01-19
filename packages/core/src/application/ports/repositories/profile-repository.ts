import type { Profile, CreateProfileInput, UpdateProfileInput } from '../../..'

/**
 * ProfileRepository interface (port)
 * Defines the contract for profile data access
 */
export interface ProfileRepository {
  /**
   * Find a profile by user ID
   */
  findByUserId(userId: string): Promise<Profile | null>

  /**
   * Create a new profile
   */
  create(input: CreateProfileInput): Promise<Profile>

  /**
   * Update an existing profile
   */
  update(userId: string, input: UpdateProfileInput): Promise<Profile>

  /**
   * Upsert a profile (create if not exists, update if exists)
   */
  upsert(input: CreateProfileInput): Promise<Profile>
}
