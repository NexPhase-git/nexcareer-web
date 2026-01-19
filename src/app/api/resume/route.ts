import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerCore } from '@/lib/core/server'
import { extractText } from 'unpdf'
import { isRateLimited, getClientIP, sanitizeFilename } from '@/lib/security'

// Allowed MIME types for resume upload
const ALLOWED_MIME_TYPES = ['application/pdf']
// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for file uploads)
    const clientIP = getClientIP(request)
    if (isRateLimited(`resume:${clientIP}`, { maxRequests: 5, windowMs: 60000 })) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a moment.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type (check both MIME type and extension)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Validate file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Validate file size is not 0
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get core for AI and storage services
    const core = await getServerCore()

    // Sanitize filename and create safe path
    const safeName = sanitizeFilename(file.name.replace('.pdf', ''))
    const filePath = `${user.id}/${Date.now()}_${safeName}.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to storage using core service
    const uploadResult = await core.services.storage.upload({
      bucket: 'resumes',
      path: filePath,
      file: new Blob([buffer], { type: 'application/pdf' }),
      contentType: 'application/pdf',
      upsert: true,
    })

    if (uploadResult.error || !uploadResult.data) {
      console.error('Upload error:', uploadResult.error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const publicUrl = uploadResult.data

    // Extract text from PDF server-side using unpdf
    let resumeText = ''
    try {
      const { text } = await extractText(buffer)
      resumeText = Array.isArray(text) ? text.join('\n') : text
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
    }

    if (!resumeText || resumeText.trim().length < 50) {
      // Just save the URL without parsing if text extraction failed or too short
      await core.useCases.updateProfile.execute({
        userId: user.id,
        resumeUrl: publicUrl,
      })

      return NextResponse.json({
        success: true,
        resumeUrl: publicUrl,
        message: 'Resume uploaded but text could not be extracted. Please update your profile manually.'
      })
    }

    // Parse resume with AI using core service
    const aiResult = await core.services.ai.parseResume(resumeText)

    if (aiResult.error || !aiResult.data) {
      return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
    }

    const parsedData = aiResult.data

    // Get existing profile to merge data
    const existingResult = await core.useCases.getProfile.execute({ userId: user.id })
    const existingProfile = existingResult.profile

    // Merge: use new value if it exists, otherwise keep existing
    const mergedProfile = {
      name: parsedData.name || existingProfile?.name || null,
      email: parsedData.email || existingProfile?.email || null,
      phone: parsedData.phone || existingProfile?.phone || null,
      summary: parsedData.summary || existingProfile?.summary || null,
      // For arrays, use new data if it has items, otherwise keep existing
      skills: (parsedData.skills?.length ?? 0) > 0
        ? parsedData.skills
        : (existingProfile?.skills || []),
      education: (parsedData.education?.length ?? 0) > 0
        ? parsedData.education
        : (existingProfile?.education || []),
      experience: (parsedData.experience?.length ?? 0) > 0
        ? parsedData.experience
        : (existingProfile?.experience || []),
      resumeUrl: publicUrl,
    }

    // Save merged profile using use case
    await core.useCases.updateProfile.execute({
      userId: user.id,
      ...mergedProfile,
    })

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
