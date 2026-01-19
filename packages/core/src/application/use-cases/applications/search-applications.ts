import type { Application } from '../../..'
import type { ApplicationRepository } from '../..'

export interface SearchApplicationsInput {
  userId: string
  keyword: string
}

export interface SearchApplicationsOutput {
  applications: Application[]
}

/**
 * Use case: Search applications by keyword
 */
export class SearchApplications {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: SearchApplicationsInput): Promise<SearchApplicationsOutput> {
    const { userId, keyword } = input

    if (!keyword.trim()) {
      return { applications: [] }
    }

    const applications = await this.applicationRepository.search(userId, keyword.trim())

    return { applications }
  }
}
