/**
 * Interview type value object
 * Represents the type of interview practice session
 */
export const INTERVIEW_TYPES = ['behavioral', 'technical', 'companySpecific'] as const

export type InterviewType = (typeof INTERVIEW_TYPES)[number]

export function isValidInterviewType(type: string): type is InterviewType {
  return INTERVIEW_TYPES.includes(type as InterviewType)
}

export function getInterviewTypeLabel(type: InterviewType): string {
  const labels: Record<InterviewType, string> = {
    behavioral: 'Behavioral',
    technical: 'Technical',
    companySpecific: 'Company Specific',
  }
  return labels[type]
}
