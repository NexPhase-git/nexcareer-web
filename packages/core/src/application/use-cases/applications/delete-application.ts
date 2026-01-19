import type { ApplicationRepository } from '../..'

export interface DeleteApplicationInput {
  id: string
  userId: string
}

/**
 * Use case: Delete an application
 * Validates ownership before deleting
 */
export class DeleteApplication {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: DeleteApplicationInput): Promise<void> {
    const { id, userId } = input

    // Verify ownership
    const existing = await this.applicationRepository.findById(id)
    if (!existing) {
      throw new Error('Application not found')
    }
    if (existing.userId !== userId) {
      throw new Error('Not authorized to delete this application')
    }

    await this.applicationRepository.delete(id)
  }
}
