import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName)

    // For now, we'll extract text client-side and send it
    // In a production app, you'd use a PDF parsing service here
    const resumeText = formData.get('text') as string

    if (!resumeText) {
      // Just save the URL without parsing
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          resume_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (profileError) {
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
      }

      return NextResponse.json({ success: true, resumeUrl: publicUrl })
    }

    // Parse resume with Groq
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

    const groqResponse = await fetch(GROQ_API_URL, {
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

    if (!groqResponse.ok) {
      return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
    }

    const groqData = await groqResponse.json()
    let content = groqData.choices[0].message.content.trim()

    // Remove markdown code blocks if present
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    const parsedData = JSON.parse(content)

    // Save to profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        summary: parsedData.summary,
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        resume_url: publicUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: parsedData,
      resumeUrl: publicUrl,
    })
  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 })
  }
}
