import type { PracticeSession, InterviewType } from '../../..'
import { createInterviewQuestion } from '../../..'
import type { ApplicationRepository, PracticeSessionRepository, ProfileRepository, AIService } from '../..'

export interface StartPracticeSessionInput {
  userId: string
  type: InterviewType
  applicationId?: string | null
  questionCount?: number
}

export interface StartPracticeSessionOutput {
  session: PracticeSession
}

/**
 * Use case: Start a new interview practice session
 * Generates AI questions based on type, profile, and selected application
 */
export class StartPracticeSession {
  constructor(
    private readonly practiceSessionRepository: PracticeSessionRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly aiService: AIService
  ) {}

  async execute(input: StartPracticeSessionInput): Promise<StartPracticeSessionOutput> {
    const { userId, type, applicationId, questionCount = 5 } = input

    // Get context for question generation
    let company: string | undefined
    let position: string | undefined
    let skills: string[] | undefined

    if (applicationId) {
      const application = await this.applicationRepository.findById(applicationId)
      if (application && application.userId === userId) {
        company = application.company
        position = application.position
      }
    }

    if (type === 'technical') {
      const profile = await this.profileRepository.findByUserId(userId)
      if (profile?.skills && profile.skills.length > 0) {
        skills = profile.skills
      }
    }

    // Generate questions
    const result = await this.aiService.generateInterviewQuestions({
      type,
      company,
      position,
      skills,
      questionCount,
    })

    if (result.error || !result.data) {
      throw new Error(result.error ?? 'Failed to generate questions')
    }

    // Create interview question entities
    const questions = result.data.map((q) => createInterviewQuestion(q))

    // Save session
    const session = await this.practiceSessionRepository.create({
      userId,
      applicationId: applicationId ?? null,
      type,
      questions,
    })

    return { session }
  }
}
