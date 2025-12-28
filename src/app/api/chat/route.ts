import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited, getClientIP, sanitizeString } from '@/lib/security'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (isRateLimited(`chat:${clientIP}`, { maxRequests: 20, windowMs: 60000 })) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const message = sanitizeString(body.message)
    const history = body.history

    if (!message || message.length < 1) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Limit message length
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Get user context
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let systemPrompt = `You are a helpful career assistant for job seekers.
Help with job search, applications, resume tips, interview preparation, and career advice.
Be concise, friendly, and actionable in your responses.
Keep responses under 300 words unless more detail is specifically requested.`

    if (user) {
      // Fetch user profile and applications for context
      const [profileResult, appsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])

      const profile = profileResult.data
      const applications = appsResult.data || []

      // Build contextual prompt
      const contextParts = ['You are a personalized career assistant.', '']

      if (profile && (profile.name || profile.skills?.length > 0)) {
        contextParts.push('USER PROFILE:')
        if (profile.name) contextParts.push(`- Name: ${profile.name}`)
        if (profile.skills?.length > 0) {
          contextParts.push(`- Skills: ${profile.skills.join(', ')}`)
        }
        if (profile.experience?.length > 0) {
          contextParts.push('- Experience:')
          profile.experience.slice(0, 3).forEach((exp: { role: string; company: string; duration?: string }) => {
            contextParts.push(`  • ${exp.role} at ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}`)
          })
        }
        contextParts.push('')
      }

      if (applications.length > 0) {
        contextParts.push('ACTIVE JOB APPLICATIONS:')
        applications.forEach((app: { company: string; position: string; status: string }) => {
          contextParts.push(`- ${app.company}: ${app.position} (${app.status})`)
        })
        contextParts.push('')
      }

      contextParts.push('INSTRUCTIONS:')
      contextParts.push("- Help with job search, applications, resume tips, interview prep, and career advice")
      contextParts.push("- Reference the user's profile and applications when relevant")
      contextParts.push('- Be concise, friendly, and actionable')
      contextParts.push('- Keep responses under 300 words unless more detail is needed')

      systemPrompt = contextParts.join('\n')
    }

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

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
      const error = await response.text()
      return NextResponse.json({ error: `API error: ${error}` }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    return NextResponse.json({ response: content })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function GET() {
  // Get suggested prompts
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const prompts = [
      'How can I improve my resume?',
      'What should I focus on this week?',
      'Give me tips for my job search',
    ]

    if (user) {
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (applications) {
        const interviews = applications.filter((a: { status: string }) => a.status === 'Interview')
        if (interviews.length > 0) {
          prompts.unshift(`Help me prepare for my interview at ${interviews[0].company}`)
        }

        const applied = applications.filter((a: { status: string }) => a.status === 'Applied')
        if (applied.length > 0) {
          prompts.push(`How can I follow up on my application at ${applied[0].company}?`)
        }
      }
    }

    return NextResponse.json({ prompts: prompts.slice(0, 4) })
  } catch {
    return NextResponse.json({ prompts: ['How can I improve my resume?', 'Give me tips for my job search'] })
  }
}
