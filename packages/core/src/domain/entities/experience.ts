/**
 * Experience entity
 * Represents work experience in a user's profile
 */
export interface Experience {
  company: string
  role: string
  duration: string | null
  description: string | null
}

export function createExperience(data: Partial<Experience>): Experience {
  return {
    company: data.company ?? '',
    role: data.role ?? '',
    duration: data.duration ?? null,
    description: data.description ?? null,
  }
}
