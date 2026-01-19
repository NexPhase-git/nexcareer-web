import type { Application, ApplicationStatus } from '../..'

/**
 * Database row type for applications table
 */
export interface ApplicationRow {
  id: string
  user_id: string
  company: string
  position: string
  status: ApplicationStatus
  applied_date: string | null
  notes: string | null
  url: string | null
  followed_up_at: string | null
  interview_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Maps database row to domain entity
 */
export function applicationRowToEntity(row: ApplicationRow): Application {
  return {
    id: row.id,
    userId: row.user_id,
    company: row.company,
    position: row.position,
    status: row.status,
    appliedDate: row.applied_date ? new Date(row.applied_date) : null,
    notes: row.notes,
    url: row.url,
    followedUpAt: row.followed_up_at ? new Date(row.followed_up_at) : null,
    interviewDate: row.interview_date ? new Date(row.interview_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Maps domain entity to database row (for inserts/updates)
 */
export function applicationEntityToRow(
  entity: Partial<Application> & { userId?: string }
): Partial<ApplicationRow> {
  const row: Partial<ApplicationRow> = {}

  if (entity.userId !== undefined) row.user_id = entity.userId
  if (entity.company !== undefined) row.company = entity.company
  if (entity.position !== undefined) row.position = entity.position
  if (entity.status !== undefined) row.status = entity.status
  if (entity.appliedDate !== undefined) {
    row.applied_date = entity.appliedDate?.toISOString().split('T')[0] ?? null
  }
  if (entity.notes !== undefined) row.notes = entity.notes
  if (entity.url !== undefined) row.url = entity.url
  if (entity.followedUpAt !== undefined) {
    row.followed_up_at = entity.followedUpAt?.toISOString() ?? null
  }
  if (entity.interviewDate !== undefined) {
    row.interview_date = entity.interviewDate?.toISOString().split('T')[0] ?? null
  }

  return row
}
