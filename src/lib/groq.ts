const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function groqChat(messages: ChatMessage[]): Promise<{ response?: string; error?: string }> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      return { error: `API error: ${response.status}` }
    }

    const data: GroqResponse = await response.json()
    return { response: data.choices[0].message.content }
  } catch (e) {
    return { error: `Failed to get response: ${e}` }
  }
}

export async function parseResume(resumeText: string): Promise<{ data?: Record<string, unknown>; error?: string }> {
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
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this resume:\n\n${resumeText}` },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      return { error: `API error: ${response.status}` }
    }

    const data: GroqResponse = await response.json()
    let content = data.choices[0].message.content.trim()

    // Remove markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    const parsedData = JSON.parse(content)
    return { data: parsedData }
  } catch (e) {
    return { error: `Failed to parse resume: ${e}` }
  }
}

export async function generateInterviewQuestions(
  type: 'behavioral' | 'technical' | 'companySpecific',
  company?: string,
  position?: string,
  skills?: string[],
  questionCount: number = 5
): Promise<{ questions?: string[]; error?: string }> {
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

  systemPrompt += '\n\nReturn ONLY a JSON array of strings with the questions, no explanation. Example: ["Question 1?", "Question 2?"]'

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the interview questions.' },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      return { error: `API error: ${response.status}` }
    }

    const data: GroqResponse = await response.json()
    let content = data.choices[0].message.content.trim()

    // Remove markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    const questions = JSON.parse(content)
    return { questions }
  } catch (e) {
    return { error: `Failed to generate questions: ${e}` }
  }
}

export async function generateFeedback(
  question: string,
  answer: string
): Promise<{ feedback?: string; error?: string }> {
  const systemPrompt = `You are an interview coach providing feedback on interview answers. Analyze the answer and provide:
1. What was done well
2. Areas for improvement
3. A suggested better answer structure

Keep feedback concise (under 200 words) and constructive.`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: ${question}\n\nAnswer: ${answer}` },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    })

    if (!response.ok) {
      return { error: `API error: ${response.status}` }
    }

    const data: GroqResponse = await response.json()
    return { feedback: data.choices[0].message.content }
  } catch (e) {
    return { error: `Failed to generate feedback: ${e}` }
  }
}
