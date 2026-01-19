import type { Application, UpdateApplicationInput, ApplicationStatus } from '../../..'
import type { ApplicationRepository } from '../..'

export interface UpdateApplicationUseCaseInput {
  id: string
  userId: string
  company?: string
  position?: string
  status?: ApplicationStatus
  appliedDate?: Date | null
  notes?: string | null
  url?: string | null
  followedUpAt?: Date | null
  interviewDate?: Date | null
}

export interface UpdateApplicationOutput {
  application: Application
}

/**
 * Use case: Update an existing application
 * Validates ownership before updating
 */
export class UpdateApplication {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: UpdateApplicationUseCaseInput): Promise<UpdateApplicationOutput> {
    const { id, userId, ...updateFields } = input

    // Verify ownership
    const existing = await this.applicationRepository.findById(id)
    if (!existing) {
      throw new Error('Application not found')
    }
    if (existing.userId !== userId) {
      throw new Error('Not authorized to update this application')
    }

    // Build update input
    const updateInput: UpdateApplicationInput = {}

    if (updateFields.company !== undefined) {
      if (!updateFields.company.trim()) {
        throw new Error('Company name cannot be empty')
      }
      updateInput.company = updateFields.company.trim()
    }

    if (updateFields.position !== undefined) {
      if (!updateFields.position.trim()) {
        throw new Error('Position cannot be empty')
      }
      updateInput.position = updateFields.position.trim()
    }

    if (updateFields.status !== undefined) {
      updateInput.status = updateFields.status
    }

    if (updateFields.appliedDate !== undefined) {
      updateInput.appliedDate = updateFields.appliedDate
    }

    if (updateFields.notes !== undefined) {
      updateInput.notes = updateFields.notes?.trim() || null
    }

    if (updateFields.url !== undefined) {
      updateInput.url = updateFields.url?.trim() || null
    }

    if (updateFields.followedUpAt !== undefined) {
      updateInput.followedUpAt = updateFields.followedUpAt
    }

    if (updateFields.interviewDate !== undefined) {
      updateInput.interviewDate = updateFields.interviewDate
    }

    const application = await this.applicationRepository.update(id, updateInput)

    return { application }
  }
}
