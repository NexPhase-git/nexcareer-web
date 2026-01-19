/**
 * InterviewQuestion entity
 * Represents a single interview question with its answer and feedback
 */
export interface InterviewQuestion {
  question: string
  answer: string | null
  feedback: string | null
}

export function createInterviewQuestion(question: string): InterviewQuestion {
  return {
    question,
    answer: null,
    feedback: null,
  }
}

export function isAnswered(question: InterviewQuestion): boolean {
  return question.answer !== null && question.answer.trim().length > 0
}

export function hasFeedback(question: InterviewQuestion): boolean {
  return question.feedback !== null && question.feedback.trim().length > 0
}
