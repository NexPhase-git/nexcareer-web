import type {
  PracticeSession,
  CreatePracticeSessionInput,
  InterviewQuestion,
} from '../../..'

/**
 * PracticeSessionRepository interface (port)
 * Defines the contract for practice session data access
 */
export interface PracticeSessionRepository {
  /**
   * Find a practice session by ID
   */
  findById(id: string): Promise<PracticeSession | null>

  /**
   * Find all practice sessions for a user
   */
  findByUserId(userId: string): Promise<PracticeSession[]>

  /**
   * Find practice sessions for a specific application
   */
  findByApplicationId(applicationId: string): Promise<PracticeSession[]>

  /**
   * Create a new practice session
   */
  create(input: CreatePracticeSessionInput): Promise<PracticeSession>

  /**
   * Update questions in a practice session
   */
  updateQuestions(sessionId: string, questions: InterviewQuestion[]): Promise<PracticeSession>

  /**
   * Delete a practice session
   */
  delete(id: string): Promise<void>
}
