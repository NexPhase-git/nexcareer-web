import type { Education, Experience } from '.'

/**
 * Profile entity
 * Represents a user's career profile
 */
export interface Profile {
  id: string
  userId: string
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
  skills: string[]
  education: Education[]
  experience: Experience[]
  resumeUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateProfileInput {
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

export interface UpdateProfileInput {
  name?: string | null
  email?: string | null
  phone?: string | null
  summary?: string | null
  skills?: string[]
  education?: Education[]
  experience?: Experience[]
  resumeUrl?: string | null
}

export function createProfile(input: CreateProfileInput): Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId: input.userId,
    name: input.name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    summary: input.summary ?? null,
    skills: input.skills ?? [],
    education: input.education ?? [],
    experience: input.experience ?? [],
    resumeUrl: input.resumeUrl ?? null,
  }
}

export function hasCompleteProfile(profile: Profile): boolean {
  return !!(
    profile.name &&
    profile.email &&
    profile.skills.length > 0 &&
    (profile.education.length > 0 || profile.experience.length > 0)
  )
}
