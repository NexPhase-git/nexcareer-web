import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

export async function POST(request: NextRequest) {
  try {
    const { question, answer } = await request.json()

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const systemPrompt = `You are an interview coach providing feedback on interview answers. Analyze the answer and provide:
1. What was done well
2. Areas for improvement
3. A suggested better answer structure

Keep feedback concise (under 200 words) and constructive.`

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
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ feedback: data.choices[0].message.content })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
