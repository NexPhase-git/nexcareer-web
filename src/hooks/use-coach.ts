'use client'

import { useState, useCallback } from 'react'
import { type Application, type InterviewType } from '@nexcareer/core'

export interface UseCoachOptions {
  applications: Application[]
}

export interface UseCoachReturn {
  selectedType: InterviewType | null
  setSelectedType: (type: InterviewType | null) => void
  selectedApplication: Application | null
  setSelectedApplication: (app: Application | null) => void
  isGenerating: boolean
  questions: string[]
  currentQuestionIndex: number
  answer: string
  setAnswer: (value: string) => void
  feedback: string | null
  isGettingFeedback: boolean
  practiceStarted: boolean
  progress: number
  isLastQuestion: boolean
  canStartPractice: boolean
  startPractice: () => Promise<void>
  submitAnswer: () => Promise<void>
  nextQuestion: () => void
  resetPractice: () => void
}

/**
 * Hook for managing interview coach practice sessions
 */
export function useCoach(options: UseCoachOptions): UseCoachReturn {
  const { applications: _applications } = options
  void _applications // Provided for future use (e.g., filtering by application)

  const [selectedType, setSelectedType] = useState<InterviewType | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isGettingFeedback, setIsGettingFeedback] = useState(false)
  const [practiceStarted, setPracticeStarted] = useState(false)

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const canStartPractice =
    !!selectedType &&
    !isGenerating &&
    (selectedType !== 'companySpecific' || !!selectedApplication)

  const startPractice = useCallback(async () => {
    if (!selectedType) return

    if (selectedType === 'companySpecific' && !selectedApplication) {
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          company: selectedApplication?.company,
          position: selectedApplication?.position,
          questionCount: 5,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Failed to generate questions:', data.error)
        return
      }

      setQuestions(data.questions)
      setPracticeStarted(true)
    } catch (error) {
      console.error('Failed to generate questions:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedType, selectedApplication])

  const submitAnswer = useCallback(async () => {
    if (!answer.trim()) return

    setIsGettingFeedback(true)

    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestionIndex],
          answer: answer,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Failed to get feedback:', data.error)
        setFeedback('Sorry, I could not generate feedback. Please try again.')
        return
      }

      setFeedback(data.feedback)
    } catch (error) {
      console.error('Failed to get feedback:', error)
      setFeedback('Sorry, I could not generate feedback. Please try again.')
    } finally {
      setIsGettingFeedback(false)
    }
  }, [answer, questions, currentQuestionIndex])

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setAnswer('')
      setFeedback(null)
    }
  }, [currentQuestionIndex, questions.length])

  const resetPractice = useCallback(() => {
    setPracticeStarted(false)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswer('')
    setFeedback(null)
    setSelectedType(null)
    setSelectedApplication(null)
  }, [])

  const handleSetSelectedType = useCallback((type: InterviewType | null) => {
    setSelectedType(type)
    if (type !== 'companySpecific') {
      setSelectedApplication(null)
    }
  }, [])

  return {
    selectedType,
    setSelectedType: handleSetSelectedType,
    selectedApplication,
    setSelectedApplication,
    isGenerating,
    questions,
    currentQuestionIndex,
    answer,
    setAnswer,
    feedback,
    isGettingFeedback,
    practiceStarted,
    progress,
    isLastQuestion,
    canStartPractice,
    startPractice,
    submitAnswer,
    nextQuestion,
    resetPractice,
  }
}
