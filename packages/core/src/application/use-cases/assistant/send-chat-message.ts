import type { ChatMessage } from '../../..'
import { createSystemMessage, createUserMessage, createAssistantMessage } from '../../..'
import type { ProfileRepository, ApplicationRepository, AIService } from '../..'

export interface SendChatMessageInput {
  userId: string
  message: string
  history: ChatMessage[]
}

export interface SendChatMessageOutput {
  response: string
  messages: ChatMessage[]
}

/**
 * Use case: Send a chat message to the AI assistant
 * Builds context from user profile and applications
 */
export class SendChatMessage {
  constructor(
    private readonly aiService: AIService,
    private readonly profileRepository: ProfileRepository,
    private readonly applicationRepository: ApplicationRepository
  ) {}

  async execute(input: SendChatMessageInput): Promise<SendChatMessageOutput> {
    const { userId, message, history } = input

    // Validate message
    if (!message.trim()) {
      throw new Error('Message cannot be empty')
    }

    if (message.length > 2000) {
      throw new Error('Message too long (max 2000 characters)')
    }

    // Build context from profile and applications
    const systemPrompt = await this.buildSystemPrompt(userId)

    // Build messages array
    const messages: ChatMessage[] = [
      createSystemMessage(systemPrompt),
      ...history.slice(-10), // Keep last 10 messages for context
      createUserMessage(message.trim()),
    ]

    // Get AI response
    const result = await this.aiService.chat(messages)

    if (result.error || !result.data) {
      throw new Error(result.error ?? 'Failed to get response')
    }

    // Return updated history
    const updatedHistory = [
      ...history,
      createUserMessage(message.trim()),
      createAssistantMessage(result.data),
    ]

    return {
      response: result.data,
      messages: updatedHistory,
    }
  }

  private async buildSystemPrompt(userId: string): Promise<string> {
    const contextParts: string[] = []

    // Fetch profile and applications in parallel
    const [profile, applications] = await Promise.all([
      this.profileRepository.findByUserId(userId),
      this.applicationRepository.findByUserId(userId).then((apps) => apps.slice(0, 10)),
    ])

    contextParts.push('You are a personalized career assistant.')
    contextParts.push('')

    if (profile && (profile.name || (profile.skills && profile.skills.length > 0))) {
      contextParts.push('USER PROFILE:')
      if (profile.name) contextParts.push(`- Name: ${profile.name}`)
      if (profile.skills && profile.skills.length > 0) {
        contextParts.push(`- Skills: ${profile.skills.join(', ')}`)
      }
      if (profile.experience && profile.experience.length > 0) {
        contextParts.push('- Experience:')
        profile.experience.slice(0, 3).forEach((exp) => {
          contextParts.push(`  • ${exp.role} at ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}`)
        })
      }
      contextParts.push('')
    }

    if (applications.length > 0) {
      contextParts.push('ACTIVE JOB APPLICATIONS:')
      applications.forEach((app) => {
        contextParts.push(`- ${app.company}: ${app.position} (${app.status})`)
      })
      contextParts.push('')
    }

    contextParts.push('INSTRUCTIONS:')
    contextParts.push("- Help with job search, applications, resume tips, interview prep, and career advice")
    contextParts.push("- Reference the user's profile and applications when relevant")
    contextParts.push('- Be concise, friendly, and actionable')
    contextParts.push('- Keep responses under 300 words unless more detail is needed')

    return contextParts.join('\n')
  }
}
