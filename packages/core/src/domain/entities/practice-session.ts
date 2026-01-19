import type { InterviewType } from '..'
import type { InterviewQuestion } from '.'

/**
 * PracticeSession entity
 * Represents an interview practice session
 */
export interface PracticeSession {
  id: string
  userId: string
  applicationId: string | null
  type: InterviewType
  questions: InterviewQuestion[]
  createdAt: Date
}

export interface CreatePracticeSessionInput {
  userId: string
  applicationId?: string | null
  type: InterviewType
  questions: InterviewQuestion[]
}

export function createPracticeSession(
  input: CreatePracticeSessionInput
): Omit<PracticeSession, 'id' | 'createdAt'> {
  return {
    userId: input.userId,
    applicationId: input.applicationId ?? null,
    type: input.type,
    questions: input.questions,
  }
}

export function getCompletionPercentage(session: PracticeSession): number {
  if (session.questions.length === 0) return 0

  const answeredCount = session.questions.filter(
    (q) => q.answer !== null && q.answer.trim().length > 0
  ).length

  return Math.round((answeredCount / session.questions.length) * 100)
}

export function isSessionComplete(session: PracticeSession): boolean {
  return getCompletionPercentage(session) === 100
}
