import type { Application } from '../../..'
import type { ApplicationRepository } from '../..'

export interface GetApplicationByIdInput {
  id: string
  userId: string
}

export interface GetApplicationByIdOutput {
  application: Application | null
}

/**
 * Use case: Get a single application by ID
 * Validates that the application belongs to the user
 */
export class GetApplicationById {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: GetApplicationByIdInput): Promise<GetApplicationByIdOutput> {
    const { id, userId } = input

    const application = await this.applicationRepository.findById(id)

    // Return null if not found or doesn't belong to user
    if (!application || application.userId !== userId) {
      return { application: null }
    }

    return { application }
  }
}
