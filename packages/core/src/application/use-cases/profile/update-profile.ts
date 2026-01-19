import type { Profile, UpdateProfileInput, Education, Experience } from '../../..'
import type { ProfileRepository } from '../..'

export interface UpdateProfileUseCaseInput {
  userId: string
  name?: string | null
  email?: string | null
  phone?: string | null
  summary?: string | null
  skills?: string[]
  education?: Education[]
  experience?: Experience[]
  resumeUrl?: string | null
}

export interface UpdateProfileOutput {
  profile: Profile
}

/**
 * Use case: Update user profile
 * Creates profile if it doesn't exist
 */
export class UpdateProfile {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: UpdateProfileUseCaseInput): Promise<UpdateProfileOutput> {
    const { userId, ...updateFields } = input

    // Check if profile exists
    const existing = await this.profileRepository.findByUserId(userId)

    const updateInput: UpdateProfileInput = {}

    if (updateFields.name !== undefined) {
      updateInput.name = updateFields.name?.trim() || null
    }

    if (updateFields.email !== undefined) {
      updateInput.email = updateFields.email?.trim() || null
    }

    if (updateFields.phone !== undefined) {
      updateInput.phone = updateFields.phone?.trim() || null
    }

    if (updateFields.summary !== undefined) {
      updateInput.summary = updateFields.summary?.trim() || null
    }

    if (updateFields.skills !== undefined) {
      updateInput.skills = updateFields.skills.filter((s) => s.trim()).map((s) => s.trim())
    }

    if (updateFields.education !== undefined) {
      updateInput.education = updateFields.education
    }

    if (updateFields.experience !== undefined) {
      updateInput.experience = updateFields.experience
    }

    if (updateFields.resumeUrl !== undefined) {
      updateInput.resumeUrl = updateFields.resumeUrl
    }

    let profile: Profile

    if (existing) {
      profile = await this.profileRepository.update(userId, updateInput)
    } else {
      profile = await this.profileRepository.create({
        userId,
        ...updateInput,
      })
    }

    return { profile }
  }
}
