import type { ApplicationRepository, ApplicationStats } from '../..'

export interface GetApplicationStatsInput {
  userId: string
}

export interface GetApplicationStatsOutput {
  stats: ApplicationStats
}

/**
 * Use case: Get application statistics for dashboard
 */
export class GetApplicationStats {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async execute(input: GetApplicationStatsInput): Promise<GetApplicationStatsOutput> {
    const stats = await this.applicationRepository.getStats(input.userId)
    return { stats }
  }
}
