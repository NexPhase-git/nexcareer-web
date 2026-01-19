/**
 * Education entity
 * Represents educational background in a user's profile
 */
export interface Education {
  school: string
  degree: string
  year: string | null
}

export function createEducation(data: Partial<Education>): Education {
  return {
    school: data.school ?? '',
    degree: data.degree ?? '',
    year: data.year ?? null,
  }
}
