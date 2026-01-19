/**
 * Database row types for direct Supabase operations
 * These use snake_case to match the database schema
 *
 * For domain types, use @nexcareer/core instead
 */

export type { ApplicationStatus } from '@nexcareer/core'

// Database row type (snake_case) for direct Supabase queries
export interface ApplicationRow {
  id?: string
  user_id: string
  company: string
  position: string
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
  applied_date: string | null
  notes: string | null
  url: string | null
  followed_up_at?: string | null
  interview_date?: string | null
  created_at?: string
  updated_at?: string
}

// Profile database row type (snake_case)
export interface ProfileRow {
  id: string
  user_id: string
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
  skills: string[]
  education: Education[]
  experience: Experience[]
  resume_url: string | null
  created_at: string
  updated_at: string
}

export interface Education {
  school: string
  degree: string
  year: string | null
}

export interface Experience {
  company: string
  role: string
  duration: string | null
  description: string | null
}

// Legacy alias for backward compatibility
export type Application = ApplicationRow
export type UserProfile = ProfileRow
