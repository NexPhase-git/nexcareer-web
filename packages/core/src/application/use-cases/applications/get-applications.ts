import type { Application, ApplicationStatus } from '../../..'
import type { ApplicationRepository } from '../..'

export interface GetApplicationsInput {
  userId: string
  status?: ApplicationStatus
}

export interface GetApplicationsOutput {
  applications: Application[]
}

/**
 * Use case: Get all applications for a user, optionally filtered by status
 */
export class GetApplications {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: GetApplicationsInput): Promise<GetApplicationsOutput> {
    const { userId, status } = input

    const applications = status
      ? await this.applicationRepository.findByStatus(userId, status)
      : await this.applicationRepository.findByUserId(userId)

    return { applications }
  }
}
