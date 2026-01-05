export interface UserProfile {
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

// Match Flutter schema exactly
export type ApplicationStatus = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'

export const APPLICATION_STATUSES: ApplicationStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

export interface SavedMessage {
  id: string
  content: string
  saved_at: string
}

export interface Application {
  id?: string
  user_id: string
  company: string
  position: string  // Flutter uses 'position', not 'role'
  status: ApplicationStatus
  applied_date: string | null  // Flutter uses 'applied_date'
  notes: string | null
  url: string | null  // Flutter uses 'url', not 'job_link'
  followed_up_at?: string | null  // For follow-up tracking
  interview_date?: string | null  // For upcoming interview reminders
  saved_messages?: SavedMessage[]  // Saved AI messages for this application
  created_at?: string
  updated_at?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export type InterviewType = 'behavioral' | 'technical' | 'companySpecific'

export interface InterviewSession {
  id: string
  user_id: string
  application_id: string | null
  type: InterviewType
  questions: InterviewQuestion[]
  created_at: string
}

export interface InterviewQuestion {
  question: string
  answer: string | null
  feedback: string | null
}
