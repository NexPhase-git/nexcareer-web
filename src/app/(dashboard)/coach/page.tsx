'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Brain, Code, Building2, Loader2, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Application, InterviewType } from '@/types/database'

interface InterviewTypeOption {
  type: InterviewType
  label: string
  description: string
  icon: React.ReactNode
}

const interviewTypes: InterviewTypeOption[] = [
  {
    type: 'behavioral',
    label: 'Behavioral',
    description: 'STAR method questions about teamwork, leadership, and problem-solving',
    icon: <Brain className="w-5 h-5" />,
  },
  {
    type: 'technical',
    label: 'Technical',
    description: 'Technical concepts and problem-solving questions',
    icon: <Code className="w-5 h-5" />,
  },
  {
    type: 'companySpecific',
    label: 'Company Specific',
    description: 'Questions tailored to a specific company and role',
    icon: <Building2 className="w-5 h-5" />,
  },
]

export default function CoachPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isGettingFeedback, setIsGettingFeedback] = useState(false)
  const [practiceStarted, setPracticeStarted] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setApplications(data as Application[])
    }

    setIsLoadingApps(false)
  }

  const startPractice = async () => {
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
        throw new Error(data.error)
      }

      setQuestions(data.questions)
      setPracticeStarted(true)
    } catch (error) {
      console.error('Failed to generate questions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const submitAnswer = async () => {
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
        throw new Error(data.error)
      }

      setFeedback(data.feedback)
    } catch (error) {
      console.error('Failed to get feedback:', error)
      setFeedback('Sorry, I could not generate feedback. Please try again.')
    } finally {
      setIsGettingFeedback(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setAnswer('')
      setFeedback(null)
    }
  }

  const resetPractice = () => {
    setPracticeStarted(false)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswer('')
    setFeedback(null)
    setSelectedType(null)
    setSelectedApplication(null)
  }

  // Practice mode
  if (practiceStarted && questions.length > 0) {
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <AppShell title="Interview Practice">
        <div className="p-4 lg:p-6 pb-24 lg:pb-6">
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-content-secondary mb-2">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-bright-green transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <Card className="border-border mb-6">
              <CardContent className="p-6">
                <p className="text-lg font-medium text-content-primary">
                  {questions[currentQuestionIndex]}
                </p>
              </CardContent>
            </Card>

            {/* Answer Input */}
            {!feedback && (
              <div className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-content-primary placeholder:text-content-tertiary focus:border-forest-green focus:ring-1 focus:ring-forest-green resize-none"
                />
                <Button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || isGettingFeedback}
                  className="w-full h-12 bg-bright-green hover:bg-[#8AD960] text-forest-green"
                >
                  {isGettingFeedback ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Getting feedback...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="space-y-4">
                <Card className="border-forest-green bg-[rgba(22,51,0,0.04)]">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-forest-green mb-3">AI Feedback</h3>
                    <p className="text-sm text-content-primary whitespace-pre-wrap">
                      {feedback}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  {!isLastQuestion && (
                    <Button
                      onClick={nextQuestion}
                      className="flex-1 h-12 bg-bright-green hover:bg-[#8AD960] text-forest-green"
                    >
                      Next Question
                    </Button>
                  )}
                  <Button
                    onClick={resetPractice}
                    variant="outline"
                    className={`${isLastQuestion ? 'flex-1' : ''} h-12 border-forest-green text-forest-green`}
                  >
                    {isLastQuestion ? 'Finish Practice' : 'End Session'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    )
  }

  // Selection mode
  return (
    <AppShell title="Interview Coach">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-6 rounded-full bg-[rgba(22,51,0,0.08)] mb-4">
              <GraduationCap className="w-12 h-12 text-forest-green" />
            </div>
            <h1 className="text-2xl font-bold text-content-primary mb-2">
              Practice Makes Perfect
            </h1>
            <p className="text-sm text-content-secondary">
              Select an interview type to start practicing with AI-generated questions and personalized feedback.
            </p>
          </div>

          {/* Interview Type Selection */}
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-content-primary">Select Interview Type</h2>
            {interviewTypes.map((option) => {
              const isSelected = selectedType === option.type
              const isDisabled = option.type === 'companySpecific' && applications.length === 0 && !isLoadingApps

              return (
                <button
                  key={option.type}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelectedType(option.type)
                      if (option.type !== 'companySpecific') {
                        setSelectedApplication(null)
                      }
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed border-border bg-muted'
                      : isSelected
                      ? 'border-forest-green bg-[rgba(22,51,0,0.08)]'
                      : 'border-border hover:border-forest-green hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isSelected ? 'bg-[rgba(22,51,0,0.12)]' : 'bg-muted'
                      }`}
                    >
                      <span className={isSelected ? 'text-forest-green' : 'text-content-secondary'}>
                        {option.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isSelected ? 'text-forest-green' : 'text-content-primary'}`}>
                        {option.label}
                      </p>
                      <p className="text-sm text-content-secondary">
                        {isDisabled ? 'Add applications to enable this option' : option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-forest-green" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Application Selection (for company-specific) */}
          {selectedType === 'companySpecific' && (
            <div className="space-y-3 mb-6">
              <h2 className="font-semibold text-content-primary">Select Application</h2>
              <p className="text-sm text-content-secondary">
                Choose a job application to practice for
              </p>
              <select
                value={selectedApplication?.id || ''}
                onChange={(e) => {
                  const app = applications.find((a) => a.id === e.target.value)
                  setSelectedApplication(app || null)
                }}
                className="w-full h-12 px-4 rounded-lg border border-border bg-background text-content-primary focus:border-forest-green focus:ring-1 focus:ring-forest-green"
              >
                <option value="">Select an application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} - {app.position}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={startPractice}
            disabled={
              !selectedType ||
              isGenerating ||
              (selectedType === 'companySpecific' && !selectedApplication)
            }
            className="w-full h-12 bg-bright-green hover:bg-[#8AD960] text-forest-green"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : (
              'Start Practice Session'
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
