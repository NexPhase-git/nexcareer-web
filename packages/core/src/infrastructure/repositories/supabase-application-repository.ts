import type { ApplicationRepository, ApplicationStats } from '../..'
import type {
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationStatus,
} from '../..'
import { APPLICATION_STATUSES } from '../..'
import type { SupabaseClient } from '..'
import {
  applicationRowToEntity,
  applicationEntityToRow,
  type ApplicationRow,
} from '..'

/**
 * Supabase implementation of ApplicationRepository
 */
export class SupabaseApplicationRepository implements ApplicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Application | null> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('id', id)
      .single() as unknown as { data: ApplicationRow | null; error: Error | null }

    if (error || !data) {
      return null
    }

    return applicationRowToEntity(data)
  }

  async findByUserId(userId: string): Promise<Application[]> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_date', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as {
      data: ApplicationRow[] | null
      error: Error | null
    }

    if (error || !data) {
      return []
    }

    return data.map(applicationRowToEntity)
  }

  async findByStatus(userId: string, status: ApplicationStatus): Promise<Application[]> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('applied_date', { ascending: false }) as unknown as {
      data: ApplicationRow[] | null
      error: Error | null
    }

    if (error || !data) {
      return []
    }

    return data.map(applicationRowToEntity)
  }

  async search(userId: string, keyword: string): Promise<Application[]> {
    const searchPattern = `%${keyword}%`

    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .or(`company.ilike.${searchPattern},position.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .order('applied_date', { ascending: false }) as unknown as {
      data: ApplicationRow[] | null
      error: Error | null
    }

    if (error || !data) {
      return []
    }

    return data.map(applicationRowToEntity)
  }

  async create(input: CreateApplicationInput): Promise<Application> {
    const row = applicationEntityToRow({
      userId: input.userId,
      company: input.company,
      position: input.position,
      status: input.status ?? 'Saved',
      appliedDate: input.appliedDate,
      notes: input.notes,
      url: input.url,
      followedUpAt: input.followedUpAt,
      interviewDate: input.interviewDate,
    })

    const { data, error } = await this.client
      .from('applications')
      .insert(row)
      .select()
      .single() as unknown as { data: ApplicationRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to create application: ${error?.message ?? 'Unknown error'}`)
    }

    return applicationRowToEntity(data)
  }

  async createMany(inputs: CreateApplicationInput[]): Promise<Application[]> {
    const rows = inputs.map((input) =>
      applicationEntityToRow({
        userId: input.userId,
        company: input.company,
        position: input.position,
        status: input.status ?? 'Saved',
        appliedDate: input.appliedDate,
        notes: input.notes,
        url: input.url,
      })
    )

    const { data, error } = await this.client
      .from('applications')
      .insert(rows)
      .select() as unknown as { data: ApplicationRow[] | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to create applications: ${error?.message ?? 'Unknown error'}`)
    }

    return data.map(applicationRowToEntity)
  }

  async update(id: string, input: UpdateApplicationInput): Promise<Application> {
    const row = applicationEntityToRow(input)

    const { data, error } = await this.client
      .from('applications')
      .update(row)
      .eq('id', id)
      .select()
      .single() as unknown as { data: ApplicationRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to update application: ${error?.message ?? 'Unknown error'}`)
    }

    return applicationRowToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('applications')
      .delete()
      .eq('id', id) as unknown as { error: Error | null }

    if (error) {
      throw new Error(`Failed to delete application: ${error.message}`)
    }
  }

  async getStats(userId: string): Promise<ApplicationStats> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('user_id', userId) as unknown as { data: ApplicationRow[] | null; error: Error | null }

    if (error || !data) {
      return {
        total: 0,
        byStatus: Object.fromEntries(
          APPLICATION_STATUSES.map((s) => [s, 0])
        ) as Record<ApplicationStatus, number>,
        thisWeek: 0,
        thisMonth: 0,
      }
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const byStatus = Object.fromEntries(
      APPLICATION_STATUSES.map((s) => [s, 0])
    ) as Record<ApplicationStatus, number>

    let thisWeek = 0
    let thisMonth = 0

    for (const row of data) {
      byStatus[row.status]++

      if (row.created_at) {
        const createdAt = new Date(row.created_at)
        if (createdAt >= oneWeekAgo) thisWeek++
        if (createdAt >= oneMonthAgo) thisMonth++
      }
    }

    return {
      total: data.length,
      byStatus,
      thisWeek,
      thisMonth,
    }
  }
}
