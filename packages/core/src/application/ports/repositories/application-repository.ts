import type {
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationStatus,
} from '../../..'

/**
 * ApplicationRepository interface (port)
 * Defines the contract for application data access
 */
export interface ApplicationRepository {
  /**
   * Find an application by ID
   */
  findById(id: string): Promise<Application | null>

  /**
   * Find all applications for a user
   */
  findByUserId(userId: string): Promise<Application[]>

  /**
   * Find applications by status
   */
  findByStatus(userId: string, status: ApplicationStatus): Promise<Application[]>

  /**
   * Search applications by keyword (company, position, notes)
   */
  search(userId: string, keyword: string): Promise<Application[]>

  /**
   * Create a new application
   */
  create(input: CreateApplicationInput): Promise<Application>

  /**
   * Create multiple applications (bulk import)
   */
  createMany(inputs: CreateApplicationInput[]): Promise<Application[]>

  /**
   * Update an existing application
   */
  update(id: string, input: UpdateApplicationInput): Promise<Application>

  /**
   * Delete an application
   */
  delete(id: string): Promise<void>

  /**
   * Get application statistics for a user
   */
  getStats(userId: string): Promise<ApplicationStats>
}

export interface ApplicationStats {
  total: number
  byStatus: Record<ApplicationStatus, number>
  thisWeek: number
  thisMonth: number
}
