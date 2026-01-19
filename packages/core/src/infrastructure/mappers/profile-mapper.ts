import type { Profile, Education, Experience } from '../..'

/**
 * Database row type for profiles table
 */
export interface ProfileRow {
  id: string
  user_id: string
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
  skills: string[]
  education: Education[]
  experience: Experience[]
  resume_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Maps database row to domain entity
 */
export function profileRowToEntity(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    summary: row.summary,
    skills: row.skills ?? [],
    education: row.education ?? [],
    experience: row.experience ?? [],
    resumeUrl: row.resume_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Maps domain entity to database row (for inserts/updates)
 */
export function profileEntityToRow(
  entity: Partial<Profile> & { userId: string }
): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = {
    user_id: entity.userId,
  }

  if (entity.name !== undefined) row.name = entity.name
  if (entity.email !== undefined) row.email = entity.email
  if (entity.phone !== undefined) row.phone = entity.phone
  if (entity.summary !== undefined) row.summary = entity.summary
  if (entity.skills !== undefined) row.skills = entity.skills
  if (entity.education !== undefined) row.education = entity.education
  if (entity.experience !== undefined) row.experience = entity.experience
  if (entity.resumeUrl !== undefined) row.resume_url = entity.resumeUrl

  return row
}
