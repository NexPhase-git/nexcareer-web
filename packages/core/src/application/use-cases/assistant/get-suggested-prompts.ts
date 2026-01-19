import type { ApplicationRepository } from '../..'

export interface GetSuggestedPromptsInput {
  userId: string
}

export interface GetSuggestedPromptsOutput {
  prompts: string[]
}

/**
 * Use case: Get personalized suggested prompts for the chat assistant
 */
export class GetSuggestedPrompts {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: GetSuggestedPromptsInput): Promise<GetSuggestedPromptsOutput> {
    const prompts: string[] = [
      'How can I improve my resume?',
      'What should I focus on this week?',
      'Give me tips for my job search',
    ]

    try {
      const applications = await this.applicationRepository.findByUserId(input.userId)

      if (applications.length > 0) {
        // Add personalized prompts based on application status
        const interviews = applications.filter((a) => a.status === 'Interview')
        if (interviews.length > 0) {
          prompts.unshift(`Help me prepare for my interview at ${interviews[0].company}`)
        }

        const applied = applications.filter((a) => a.status === 'Applied')
        if (applied.length > 0) {
          prompts.push(`How can I follow up on my application at ${applied[0].company}?`)
        }
      }
    } catch {
      // Return default prompts if there's an error
    }

    return { prompts: prompts.slice(0, 4) }
  }
}
