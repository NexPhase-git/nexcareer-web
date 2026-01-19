import type { Profile } from '../../..'
import type { ProfileRepository } from '../..'

export interface GetProfileInput {
  userId: string
}

export interface GetProfileOutput {
  profile: Profile | null
}

/**
 * Use case: Get user profile
 */
export class GetProfile {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: GetProfileInput): Promise<GetProfileOutput> {
    const profile = await this.profileRepository.findByUserId(input.userId)
    return { profile }
  }
}
