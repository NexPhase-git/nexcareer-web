import type { ApplicationStatus } from '..'

/**
 * Application entity
 * Represents a job application being tracked
 */
export interface Application {
  id: string
  userId: string
  company: string
  position: string
  status: ApplicationStatus
  appliedDate: Date | null
  notes: string | null
  url: string | null
  followedUpAt: Date | null
  interviewDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateApplicationInput {
  userId: string
  company: string
  position: string
  status?: ApplicationStatus
  appliedDate?: Date | null
  notes?: string | null
  url?: string | null
  followedUpAt?: Date | null
  interviewDate?: Date | null
}

export interface UpdateApplicationInput {
  company?: string
  position?: string
  status?: ApplicationStatus
  appliedDate?: Date | null
  notes?: string | null
  url?: string | null
  followedUpAt?: Date | null
  interviewDate?: Date | null
}

export function createApplication(
  input: CreateApplicationInput
): Omit<Application, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId: input.userId,
    company: input.company,
    position: input.position,
    status: input.status ?? 'Saved',
    appliedDate: input.appliedDate ?? null,
    notes: input.notes ?? null,
    url: input.url ?? null,
    followedUpAt: input.followedUpAt ?? null,
    interviewDate: input.interviewDate ?? null,
  }
}

export function isActiveApplication(application: Application): boolean {
  return !['Offer', 'Rejected'].includes(application.status)
}

export function needsFollowUp(application: Application, daysSinceApplied: number = 7): boolean {
  if (application.status !== 'Applied' || !application.appliedDate) {
    return false
  }

  const daysDiff = Math.floor(
    (Date.now() - application.appliedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysDiff >= daysSinceApplied && !application.followedUpAt
}
