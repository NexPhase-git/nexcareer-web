import type { ChatMessage, InterviewType } from '../../..'

/**
 * AIService interface (port)
 * Defines the contract for AI-powered features
 */
export interface AIService {
  /**
   * Send a chat message and get a response
   */
  chat(messages: ChatMessage[]): Promise<AIResponse<string>>

  /**
   * Parse resume text and extract structured data
   */
  parseResume(resumeText: string): Promise<AIResponse<ParsedResume>>

  /**
   * Generate interview questions
   */
  generateInterviewQuestions(params: GenerateQuestionsParams): Promise<AIResponse<string[]>>

  /**
   * Generate feedback for an interview answer
   */
  generateFeedback(question: string, answer: string): Promise<AIResponse<string>>
}

export interface AIResponse<T> {
  data?: T
  error?: string
}

export interface ParsedResume {
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
  skills: string[]
  education: Array<{
    school: string
    degree: string
    year: string | null
  }>
  experience: Array<{
    company: string
    role: string
    duration: string | null
    description: string | null
  }>
}

export interface GenerateQuestionsParams {
  type: InterviewType
  company?: string
  position?: string
  skills?: string[]
  questionCount?: number
}
