'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Brain, Send, RefreshCw, Loader2, User } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/types/database'

const MAX_CHARACTERS = 500
const COOLDOWN_MS = 2000

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadSuggestedPrompts()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadSuggestedPrompts = async () => {
    try {
      const response = await fetch('/api/chat')
      const data = await response.json()
      setSuggestedPrompts(data.prompts || [])
    } catch {
      setSuggestedPrompts(['How can I improve my resume?', 'Give me tips for my job search'])
    }
    setIsLoadingPrompts(false)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }, 100)
  }

  const canSend = !isLoading && !isCooldown && input.length <= MAX_CHARACTERS

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || !canSend) return

    if (messageText.length > MAX_CHARACTERS) return

    setInput('')

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: messages,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      startCooldown()
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startCooldown = () => {
    setIsCooldown(true)
    setTimeout(() => setIsCooldown(false), COOLDOWN_MS)
  }

  const resetChat = () => {
    setMessages([])
    loadSuggestedPrompts()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isOverLimit = input.length > MAX_CHARACTERS

  return (
    <AppShell
      title="AI Assistant"
      actions={
        messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetChat}
            className="text-content-secondary"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        )
      }
    >
      <div className="flex flex-col h-[calc(100vh-65px)] lg:h-[calc(100vh-73px)]">
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
          {messages.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
              <div className="p-6 rounded-full bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] mb-6">
                <Brain className="w-12 h-12 text-accent-green" />
              </div>
              <h2 className="text-xl font-bold text-content-primary mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-content-secondary mb-8">
                Ask me anything about your job search, resume, interviews, or career planning.
              </p>

              {isLoadingPrompts ? (
                <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
              ) : (
                <div className="w-full space-y-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(prompt)}
                      className="w-full p-3 text-left text-sm rounded-lg border border-border hover:border-accent-green hover:bg-muted transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Messages list
            <div className="max-w-3xl mx-auto space-y-4 pb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] flex items-center justify-center">
                      <Brain className="w-4 h-4 text-accent-green" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'avatar-bg avatar-text rounded-br-sm'
                        : 'bg-card border border-border rounded-bl-sm'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="text-sm markdown-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full avatar-bg flex items-center justify-center">
                      <User className="w-4 h-4 avatar-text" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] flex items-center justify-center">
                    <Brain className="w-4 h-4 text-accent-green" />
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-border rounded-bl-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-content-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-content-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-content-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4 pb-24 lg:pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  className={`w-full px-4 py-3 pr-12 rounded-2xl border resize-none text-sm ${
                    isOverLimit
                      ? 'border-destructive focus:border-destructive focus:ring-destructive'
                      : 'border-border focus:border-forest-green focus:ring-forest-green'
                  } bg-background text-content-primary placeholder:text-content-tertiary focus:ring-1`}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={!canSend || !input.trim()}
                size="icon"
                className={`h-12 w-12 rounded-full ${
                  canSend && input.trim()
                    ? 'avatar-bg avatar-text hover:opacity-90'
                    : 'bg-muted text-content-secondary'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Character count */}
            <div className="flex justify-end mt-1 gap-2">
              {isCooldown && (
                <span className="text-xs text-content-secondary">Wait...</span>
              )}
              <span
                className={`text-xs ${
                  isOverLimit ? 'text-destructive font-semibold' : 'text-content-secondary'
                }`}
              >
                {input.length} / {MAX_CHARACTERS}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
