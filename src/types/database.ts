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

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: string
  user_id: string
  company: string
  role: string
  status: ApplicationStatus
  date_applied: string | null
  job_link: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PracticeSession {
  id: string
  user_id: string
  application_id: string | null
  questions: PracticeQuestion[]
  created_at: string
}

export interface PracticeQuestion {
  question: string
  answer: string | null
  feedback: string | null
}
