import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerCore } from '@/lib/core/server'
import { isRateLimited, getClientIP, sanitizeString } from '@/lib/security'
import { type InterviewType, INTERVIEW_TYPES } from '@nexcareer/core'

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
    const type = sanitizeString(body.type) as InterviewType
    const company = sanitizeString(body.company)
    const position = sanitizeString(body.position)
    const skills = Array.isArray(body.skills)
      ? body.skills.map((s: string) => sanitizeString(s)).filter(Boolean)
      : []
    const questionCount = Math.min(Math.max(parseInt(body.questionCount) || 5, 1), 10)

    if (!type) {
      return NextResponse.json({ error: 'Interview type is required' }, { status: 400 })
    }

    if (!INTERVIEW_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid interview type' }, { status: 400 })
    }

    if (type === 'companySpecific' && (!company || !position)) {
      return NextResponse.json(
        { error: 'Company and position are required for company-specific interviews' },
        { status: 400 }
      )
    }

    // Use clean architecture AI service
    const core = await getServerCore()
    const result = await core.services.ai.generateInterviewQuestions({
      type,
      company: company || undefined,
      position: position || undefined,
      skills: skills.length > 0 ? skills : undefined,
      questionCount,
    })

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to generate questions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions: result.data })
  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
