import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerCore } from '@/lib/core/server'
import { isRateLimited, getClientIP, sanitizeString } from '@/lib/security'

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
    if (isRateLimited(`feedback:${clientIP}`, { maxRequests: 20, windowMs: 60000 })) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const question = sanitizeString(body.question)
    const answer = sanitizeString(body.answer)

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    // Limit input length
    if (question.length > 1000 || answer.length > 5000) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }

    // Use clean architecture AI service
    const core = await getServerCore()
    const result = await core.services.ai.generateFeedback(question, answer)

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to generate feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ feedback: result.data })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
