import type { ProfileRepository } from '../..'
import type { Profile, CreateProfileInput, UpdateProfileInput } from '../..'
import type { SupabaseClient } from '..'
import {
  profileRowToEntity,
  profileEntityToRow,
  type ProfileRow,
} from '..'

/**
 * Supabase implementation of ProfileRepository
 */
export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single() as unknown as { data: ProfileRow | null; error: Error | null }

    if (error || !data) {
      return null
    }

    return profileRowToEntity(data)
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    const row = profileEntityToRow({ ...input, userId: input.userId })

    const { data, error } = await this.client
      .from('profiles')
      .insert(row)
      .select()
      .single() as unknown as { data: ProfileRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to create profile: ${error?.message ?? 'Unknown error'}`)
    }

    return profileRowToEntity(data)
  }

  async update(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const row = profileEntityToRow({ ...input, userId })

    const { data, error } = await this.client
      .from('profiles')
      .update(row)
      .eq('user_id', userId)
      .select()
      .single() as unknown as { data: ProfileRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to update profile: ${error?.message ?? 'Unknown error'}`)
    }

    return profileRowToEntity(data)
  }

  async upsert(input: CreateProfileInput): Promise<Profile> {
    const row = profileEntityToRow({ ...input, userId: input.userId })

    const { data, error } = await this.client
      .from('profiles')
      .upsert(row)
      .select()
      .single() as unknown as { data: ProfileRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to upsert profile: ${error?.message ?? 'Unknown error'}`)
    }

    return profileRowToEntity(data)
  }
}
