import type { Application, CreateApplicationInput } from '../../..'
import type { ApplicationRepository } from '../..'

export interface CreateApplicationUseCaseInput {
  userId: string
  company: string
  position: string
  status?: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
  appliedDate?: Date | null
  notes?: string | null
  url?: string | null
}

export interface CreateApplicationOutput {
  application: Application
}

/**
 * Use case: Create a new job application
 */
export class CreateApplication {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: CreateApplicationUseCaseInput): Promise<CreateApplicationOutput> {
    // Validate required fields
    if (!input.company.trim()) {
      throw new Error('Company name is required')
    }

    if (!input.position.trim()) {
      throw new Error('Position is required')
    }

    const createInput: CreateApplicationInput = {
      userId: input.userId,
      company: input.company.trim(),
      position: input.position.trim(),
      status: input.status ?? 'Saved',
      appliedDate: input.appliedDate,
      notes: input.notes?.trim() || null,
      url: input.url?.trim() || null,
    }

    const application = await this.applicationRepository.create(createInput)

    return { application }
  }
}
