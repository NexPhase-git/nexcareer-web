import type { Application, CreateApplicationInput, ApplicationStatus } from '../../..'
import { isValidApplicationStatus } from '../../..'
import type { ApplicationRepository } from '../..'

export interface ImportApplicationRecord {
  company: string
  position: string
  status?: string
  appliedDate?: string | null
  notes?: string | null
  url?: string | null
}

export interface ImportApplicationsInput {
  userId: string
  records: ImportApplicationRecord[]
}

export interface ImportApplicationsOutput {
  imported: Application[]
  errors: Array<{ index: number; error: string }>
}

/**
 * Use case: Bulk import applications (e.g., from CSV)
 */
export class ImportApplications {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: ImportApplicationsInput): Promise<ImportApplicationsOutput> {
    const { userId, records } = input
    const validInputs: CreateApplicationInput[] = []
    const errors: Array<{ index: number; error: string }> = []

    // Validate each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      if (!record.company?.trim()) {
        errors.push({ index: i, error: 'Company name is required' })
        continue
      }

      if (!record.position?.trim()) {
        errors.push({ index: i, error: 'Position is required' })
        continue
      }

      // Parse and validate status
      let status: ApplicationStatus = 'Saved'
      if (record.status) {
        const normalizedStatus = this.normalizeStatus(record.status)
        if (normalizedStatus && isValidApplicationStatus(normalizedStatus)) {
          status = normalizedStatus
        }
      }

      // Parse applied date
      let appliedDate: Date | null = null
      if (record.appliedDate) {
        const parsed = new Date(record.appliedDate)
        if (!isNaN(parsed.getTime())) {
          appliedDate = parsed
        }
      }

      validInputs.push({
        userId,
        company: record.company.trim(),
        position: record.position.trim(),
        status,
        appliedDate,
        notes: record.notes?.trim() || null,
        url: record.url?.trim() || null,
      })
    }

    // Bulk create valid records
    const imported = validInputs.length > 0
      ? await this.applicationRepository.createMany(validInputs)
      : []

    return { imported, errors }
  }

  private normalizeStatus(status: string): ApplicationStatus | null {
    const normalized = status.trim().toLowerCase()
    const mapping: Record<string, ApplicationStatus> = {
      saved: 'Saved',
      applied: 'Applied',
      interview: 'Interview',
      interviewing: 'Interview',
      offer: 'Offer',
      offered: 'Offer',
      rejected: 'Rejected',
      declined: 'Rejected',
    }
    return mapping[normalized] ?? null
  }
}
