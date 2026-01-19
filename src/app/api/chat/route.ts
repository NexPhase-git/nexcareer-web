import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerCore } from '@/lib/core/server'
import { isRateLimited, getClientIP, sanitizeString } from '@/lib/security'

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
    const history = body.history || []

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use clean architecture use case
    const core = await getServerCore()
    const result = await core.useCases.sendChatMessage.execute({
      userId: user.id,
      message,
      history,
    })

    return NextResponse.json({ response: result.response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Return default prompts for unauthenticated users
      return NextResponse.json({
        prompts: ['How can I improve my resume?', 'Give me tips for my job search']
      })
    }

    // Use clean architecture use case
    const core = await getServerCore()
    const result = await core.useCases.getSuggestedPrompts.execute({
      userId: user.id,
    })

    return NextResponse.json({ prompts: result.prompts })
  } catch {
    return NextResponse.json({
      prompts: ['How can I improve my resume?', 'Give me tips for my job search']
    })
  }
}
