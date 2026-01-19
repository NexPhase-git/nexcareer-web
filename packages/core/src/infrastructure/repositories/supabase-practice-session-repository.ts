import type { PracticeSessionRepository } from '../..'
import type {
  PracticeSession,
  CreatePracticeSessionInput,
  InterviewQuestion,
} from '../..'
import type { SupabaseClient } from '..'
import {
  practiceSessionRowToEntity,
  practiceSessionEntityToRow,
  type PracticeSessionRow,
} from '..'

/**
 * Supabase implementation of PracticeSessionRepository
 */
export class SupabasePracticeSessionRepository implements PracticeSessionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<PracticeSession | null> {
    const { data, error } = await this.client
      .from('practice_sessions')
      .select('*')
      .eq('id', id)
      .single() as unknown as { data: PracticeSessionRow | null; error: Error | null }

    if (error || !data) {
      return null
    }

    return practiceSessionRowToEntity(data)
  }

  async findByUserId(userId: string): Promise<PracticeSession[]> {
    const { data, error } = await this.client
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as unknown as {
      data: PracticeSessionRow[] | null
      error: Error | null
    }

    if (error || !data) {
      return []
    }

    return data.map(practiceSessionRowToEntity)
  }

  async findByApplicationId(applicationId: string): Promise<PracticeSession[]> {
    const { data, error } = await this.client
      .from('practice_sessions')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false }) as unknown as {
      data: PracticeSessionRow[] | null
      error: Error | null
    }

    if (error || !data) {
      return []
    }

    return data.map(practiceSessionRowToEntity)
  }

  async create(input: CreatePracticeSessionInput): Promise<PracticeSession> {
    const row = practiceSessionEntityToRow({
      userId: input.userId,
      applicationId: input.applicationId,
      type: input.type,
      questions: input.questions,
    })

    const { data, error } = await this.client
      .from('practice_sessions')
      .insert(row)
      .select()
      .single() as unknown as { data: PracticeSessionRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to create practice session: ${error?.message ?? 'Unknown error'}`)
    }

    return practiceSessionRowToEntity(data)
  }

  async updateQuestions(
    sessionId: string,
    questions: InterviewQuestion[]
  ): Promise<PracticeSession> {
    const { data, error } = await this.client
      .from('practice_sessions')
      .update({ questions })
      .eq('id', sessionId)
      .select()
      .single() as unknown as { data: PracticeSessionRow | null; error: Error | null }

    if (error || !data) {
      throw new Error(`Failed to update practice session: ${error?.message ?? 'Unknown error'}`)
    }

    return practiceSessionRowToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('practice_sessions')
      .delete()
      .eq('id', id) as unknown as { error: Error | null }

    if (error) {
      throw new Error(`Failed to delete practice session: ${error.message}`)
    }
  }
}
