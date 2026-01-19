import type { Profile } from '../../..'
import type { ProfileRepository, AIService, StorageService, PDFParserService } from '../..'

export interface ParseResumeInput {
  userId: string
  file: File | Blob
  fileName: string
}

export interface ParseResumeOutput {
  profile: Profile
  resumeUrl: string
}

/**
 * Use case: Upload and parse resume, then update profile
 * Merges parsed data with existing profile (doesn't overwrite manual edits)
 */
export class ParseResume {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly aiService: AIService,
    private readonly storageService: StorageService,
    private readonly pdfParser: PDFParserService
  ) {}

  async execute(input: ParseResumeInput): Promise<ParseResumeOutput> {
    const { userId, file, fileName } = input

    // 1. Extract text from PDF
    const parseResult = await this.pdfParser.extractText(file)
    if (parseResult.error || !parseResult.text) {
      throw new Error(parseResult.error ?? 'Failed to extract text from PDF')
    }

    // 2. Upload file to storage
    const uploadResult = await this.storageService.upload({
      bucket: 'resumes',
      path: `${userId}/${Date.now()}-${fileName}`,
      file,
      contentType: 'application/pdf',
      upsert: true,
    })

    if (uploadResult.error || !uploadResult.data) {
      throw new Error(uploadResult.error ?? 'Failed to upload resume')
    }

    const resumeUrl = uploadResult.data

    // 3. Parse resume with AI
    const aiResult = await this.aiService.parseResume(parseResult.text)
    if (aiResult.error || !aiResult.data) {
      throw new Error(aiResult.error ?? 'Failed to parse resume')
    }

    const parsed = aiResult.data

    // 4. Get existing profile (or create empty one)
    const existing = await this.profileRepository.findByUserId(userId)

    // 5. Smart merge: parsed data fills in blanks, doesn't overwrite existing
    const mergedProfile = {
      userId,
      name: existing?.name || parsed.name || null,
      email: existing?.email || parsed.email || null,
      phone: existing?.phone || parsed.phone || null,
      summary: existing?.summary || parsed.summary || null,
      skills: this.mergeSkills(existing?.skills ?? [], parsed.skills ?? []),
      education: this.mergeEducation(existing?.education ?? [], parsed.education ?? []),
      experience: this.mergeExperience(existing?.experience ?? [], parsed.experience ?? []),
      resumeUrl,
    }

    // 6. Upsert profile
    const profile = await this.profileRepository.upsert(mergedProfile)

    return { profile, resumeUrl }
  }

  private mergeSkills(existing: string[], parsed: string[]): string[] {
    const combined = new Set([...existing, ...parsed])
    return Array.from(combined)
  }

  private mergeEducation(
    existing: Array<{ school: string; degree: string; year: string | null }>,
    parsed: Array<{ school: string; degree: string; year: string | null }>
  ) {
    // Keep existing if present, add new unique entries from parsed
    const existingKeys = new Set(existing.map((e) => `${e.school}|${e.degree}`.toLowerCase()))

    const newEntries = parsed.filter(
      (p) => !existingKeys.has(`${p.school}|${p.degree}`.toLowerCase())
    )

    return [...existing, ...newEntries]
  }

  private mergeExperience(
    existing: Array<{
      company: string
      role: string
      duration: string | null
      description: string | null
    }>,
    parsed: Array<{
      company: string
      role: string
      duration: string | null
      description: string | null
    }>
  ) {
    const existingKeys = new Set(existing.map((e) => `${e.company}|${e.role}`.toLowerCase()))

    const newEntries = parsed.filter(
      (p) => !existingKeys.has(`${p.company}|${p.role}`.toLowerCase())
    )

    return [...existing, ...newEntries]
  }
}
