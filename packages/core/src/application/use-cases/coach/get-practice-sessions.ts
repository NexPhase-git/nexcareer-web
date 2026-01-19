import type { PracticeSession } from '../../..'
import type { PracticeSessionRepository } from '../..'

export interface GetPracticeSessionsInput {
  userId: string
  applicationId?: string
}

export interface GetPracticeSessionsOutput {
  sessions: PracticeSession[]
}

/**
 * Use case: Get practice sessions for a user
 */
export class GetPracticeSessions {
  constructor(private readonly practiceSessionRepository: PracticeSessionRepository) {}

  async execute(input: GetPracticeSessionsInput): Promise<GetPracticeSessionsOutput> {
    const { userId, applicationId } = input

    const sessions = applicationId
      ? await this.practiceSessionRepository.findByApplicationId(applicationId)
      : await this.practiceSessionRepository.findByUserId(userId)

    // Filter by user ownership if fetched by application
    const userSessions = sessions.filter((s) => s.userId === userId)

    return { sessions: userSessions }
  }
}
