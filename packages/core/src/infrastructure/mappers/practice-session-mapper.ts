import type { PracticeSession, InterviewQuestion, InterviewType } from '../..'

/**
 * Database row type for practice_sessions table
 */
export interface PracticeSessionRow {
  id: string
  user_id: string
  application_id: string | null
  type: InterviewType
  questions: InterviewQuestion[]
  created_at: string
}

/**
 * Maps database row to domain entity
 */
export function practiceSessionRowToEntity(row: PracticeSessionRow): PracticeSession {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    type: row.type,
    questions: row.questions ?? [],
    createdAt: new Date(row.created_at),
  }
}

/**
 * Maps domain entity to database row (for inserts/updates)
 */
export function practiceSessionEntityToRow(
  entity: Partial<PracticeSession> & { userId?: string }
): Partial<PracticeSessionRow> {
  const row: Partial<PracticeSessionRow> = {}

  if (entity.userId !== undefined) row.user_id = entity.userId
  if (entity.applicationId !== undefined) row.application_id = entity.applicationId
  if (entity.type !== undefined) row.type = entity.type
  if (entity.questions !== undefined) row.questions = entity.questions

  return row
}
