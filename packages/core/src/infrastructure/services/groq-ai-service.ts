import type {
  AIService,
  AIResponse,
  ParsedResume,
  GenerateQuestionsParams,
  ChatMessage,
} from '../..'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

interface GroqConfig {
  apiKey: string
  model?: string
}

interface GroqApiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqApiResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/**
 * Groq implementation of AIService
 */
export class GroqAIService implements AIService {
  private readonly apiKey: string
  private readonly model: string

  constructor(config: GroqConfig) {
    this.apiKey = config.apiKey
    this.model = config.model ?? DEFAULT_MODEL
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse<string>> {
    try {
      const apiMessages: GroqApiMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await this.callGroqApi(apiMessages, {
        temperature: 0.7,
        maxTokens: 1024,
      })

      return { data: response }
    } catch (error) {
      return { error: `Chat failed: ${error}` }
    }
  }

  async parseResume(resumeText: string): Promise<AIResponse<ParsedResume>> {
    const systemPrompt = `You are a resume parser. Extract information from the resume text and return ONLY valid JSON with this exact structure:
{
  "name": "Full name or null if not found",
  "email": "Email address or null if not found",
  "phone": "Phone number or null if not found",
  "summary": "Professional summary or objective or null if not found",
  "skills": ["skill1", "skill2"],
  "education": [{"school": "School name", "degree": "Degree name", "year": "Year or date range"}],
  "experience": [{"company": "Company name", "role": "Job title", "duration": "Date range", "description": "Brief description of responsibilities"}]
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- Use null for fields you cannot find
- Use empty arrays [] if no items found for skills, education, or experience
- Keep descriptions concise (max 100 words each)
- Extract ALL skills mentioned anywhere in the resume`

    try {
      const response = await this.callGroqApi(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this resume:\n\n${resumeText}` },
        ],
        { temperature: 0.1, maxTokens: 2048 }
      )

      const parsed = this.parseJsonResponse<ParsedResume>(response)
      return { data: parsed }
    } catch (error) {
      return { error: `Resume parsing failed: ${error}` }
    }
  }

  async generateInterviewQuestions(
    params: GenerateQuestionsParams
  ): Promise<AIResponse<string[]>> {
    const { type, company, position, skills, questionCount = 5 } = params

    let systemPrompt = ''

    switch (type) {
      case 'behavioral':
        systemPrompt = `You are an interview coach. Generate ${questionCount} behavioral interview questions using the STAR method format. Focus on common workplace scenarios like teamwork, conflict resolution, leadership, and problem-solving.`
        break
      case 'technical':
        systemPrompt = `You are a technical interviewer. Generate ${questionCount} technical interview questions${skills?.length ? ` focused on these skills: ${skills.join(', ')}` : ''}. Include a mix of conceptual and problem-solving questions.`
        break
      case 'companySpecific':
        systemPrompt = `You are an interview coach helping someone prepare for an interview at ${company} for the position of ${position}. Generate ${questionCount} interview questions that are likely to be asked at this company for this role. Include a mix of behavioral and role-specific questions.`
        break
    }

    systemPrompt +=
      '\n\nReturn ONLY a JSON array of strings with the questions, no explanation. Example: ["Question 1?", "Question 2?"]'

    try {
      const response = await this.callGroqApi(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the interview questions.' },
        ],
        { temperature: 0.8, maxTokens: 1024 }
      )

      const questions = this.parseJsonResponse<string[]>(response)
      return { data: questions }
    } catch (error) {
      return { error: `Question generation failed: ${error}` }
    }
  }

  async generateFeedback(question: string, answer: string): Promise<AIResponse<string>> {
    const systemPrompt = `You are an interview coach providing feedback on interview answers. Analyze the answer and provide:
1. What was done well
2. Areas for improvement
3. A suggested better answer structure

Keep feedback concise (under 200 words) and constructive.`

    try {
      const response = await this.callGroqApi(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: ${question}\n\nAnswer: ${answer}` },
        ],
        { temperature: 0.7, maxTokens: 512 }
      )

      return { data: response }
    } catch (error) {
      return { error: `Feedback generation failed: ${error}` }
    }
  }

  private async callGroqApi(
    messages: GroqApiMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: GroqApiResponse = await response.json()
    return data.choices[0].message.content
  }

  private parseJsonResponse<T>(content: string): T {
    let cleaned = content.trim()

    // Remove markdown code blocks if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    return JSON.parse(cleaned) as T
  }
}
