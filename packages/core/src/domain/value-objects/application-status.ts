/**
 * Application status value object
 * Represents the current state of a job application
 */
export const APPLICATION_STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export function isValidApplicationStatus(status: string): status is ApplicationStatus {
  return APPLICATION_STATUSES.includes(status as ApplicationStatus)
}

export function getNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    Saved: ['Applied'],
    Applied: ['Interview', 'Rejected'],
    Interview: ['Offer', 'Rejected'],
    Offer: [],
    Rejected: [],
  }
  return transitions[current]
}
