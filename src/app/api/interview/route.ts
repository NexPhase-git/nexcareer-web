import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited, getClientIP, sanitizeString } from '@/lib/security'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const clientIP = getClientIP(request)
    if (isRateLimited(`interview:${clientIP}`, { maxRequests: 10, windowMs: 60000 })) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const type = sanitizeString(body.type)
    const company = sanitizeString(body.company)
    const position = sanitizeString(body.position)
    const skills = Array.isArray(body.skills)
      ? body.skills.map((s: string) => sanitizeString(s)).filter(Boolean)
      : []
    const questionCount = Math.min(Math.max(parseInt(body.questionCount) || 5, 1), 10)

    if (!type) {
      return NextResponse.json({ error: 'Interview type is required' }, { status: 400 })
    }

    let systemPrompt = ''

    const validTypes = ['behavioral', 'technical', 'companySpecific']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid interview type' }, { status: 400 })
    }

    switch (type) {
      case 'behavioral':
        systemPrompt = `You are an interview coach. Generate ${questionCount} behavioral interview questions using the STAR method format. Focus on common workplace scenarios like teamwork, conflict resolution, leadership, and problem-solving.`
        break
      case 'technical':
        systemPrompt = `You are a technical interviewer. Generate ${questionCount} technical interview questions${skills.length > 0 ? ` focused on these skills: ${skills.slice(0, 10).join(', ')}` : ''}. Include a mix of conceptual and problem-solving questions.`
        break
      case 'companySpecific':
        if (!company || !position) {
          return NextResponse.json({ error: 'Company and position are required for company-specific interviews' }, { status: 400 })
        }
        systemPrompt = `You are an interview coach helping someone prepare for an interview at ${company} for the position of ${position}. Generate ${questionCount} interview questions that are likely to be asked at this company for this role. Include a mix of behavioral and role-specific questions.`
        break
    }

    systemPrompt += '\n\nReturn ONLY a JSON array of strings with the questions, no explanation. Example: ["Question 1?", "Question 2?"]'

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
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    let content = data.choices[0].message.content.trim()

    // Remove markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    const questions = JSON.parse(content)
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
