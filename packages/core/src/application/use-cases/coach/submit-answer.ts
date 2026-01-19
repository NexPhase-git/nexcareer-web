import type { PracticeSession } from '../../..'
import type { PracticeSessionRepository, AIService } from '../..'

export interface SubmitAnswerInput {
  userId: string
  sessionId: string
  questionIndex: number
  answer: string
}

export interface SubmitAnswerOutput {
  session: PracticeSession
  feedback: string
}

/**
 * Use case: Submit an answer to an interview question and get AI feedback
 */
export class SubmitAnswer {
  constructor(
    private readonly practiceSessionRepository: PracticeSessionRepository,
    private readonly aiService: AIService
  ) {}

  async execute(input: SubmitAnswerInput): Promise<SubmitAnswerOutput> {
    const { userId, sessionId, questionIndex, answer } = input

    // Get the session
    const session = await this.practiceSessionRepository.findById(sessionId)

    if (!session) {
      throw new Error('Practice session not found')
    }

    if (session.userId !== userId) {
      throw new Error('Not authorized to access this session')
    }

    if (questionIndex < 0 || questionIndex >= session.questions.length) {
      throw new Error('Invalid question index')
    }

    if (!answer.trim()) {
      throw new Error('Answer cannot be empty')
    }

    const question = session.questions[questionIndex]

    // Generate feedback
    const feedbackResult = await this.aiService.generateFeedback(question.question, answer.trim())

    if (feedbackResult.error || !feedbackResult.data) {
      throw new Error(feedbackResult.error ?? 'Failed to generate feedback')
    }

    // Update the question with answer and feedback
    const updatedQuestions = [...session.questions]
    updatedQuestions[questionIndex] = {
      ...question,
      answer: answer.trim(),
      feedback: feedbackResult.data,
    }

    // Save updated session
    const updatedSession = await this.practiceSessionRepository.updateQuestions(
      sessionId,
      updatedQuestions
    )

    return {
      session: updatedSession,
      feedback: feedbackResult.data,
    }
  }
}
