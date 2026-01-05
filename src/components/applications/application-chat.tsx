'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bookmark, Copy, Loader2, Check, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import type { Application, ApplicationStatus } from '@/types/database'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const suggestedPromptsByStatus: Record<ApplicationStatus, string[]> = {
  Saved: [
    'Should I apply?',
    'Research {company}',
    'Tailor my resume',
    'What skills are needed?',
  ],
  Applied: [
    'Draft follow-up email',
    'What to expect next',
    'Research {company}',
    'How long to wait?',
  ],
  Interview: [
    'Prepare for interview',
    'Common questions for {position}',
    'Questions to ask them',
    'What to wear?',
  ],
  Offer: [
    'How to negotiate salary',
    'Questions about offer',
    'Compare with market rate',
    'What to ask HR?',
  ],
  Rejected: [
    'Why might I be rejected?',
    'How to improve',
    'Draft feedback request',
    'What to do next?',
  ],
}

interface ApplicationChatProps {
  application: Application
  onSaveMessage: (content: string) => Promise<void>
}

export function ApplicationChat({ application, onSaveMessage }: ApplicationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const buildSystemPrompt = () => {
    return `You are helping the user with their job application.

Application Details:
- Company: ${application.company}
- Position: ${application.position}
- Status: ${application.status}
- Applied Date: ${application.applied_date || 'Not specified'}
- Notes: ${application.notes || 'None'}

Provide specific, actionable advice for this role and company. Keep responses concise and helpful.`
  }

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: buildSystemPrompt(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    const filledPrompt = prompt
      .replace('{company}', application.company)
      .replace('{position}', application.position)
    sendMessage(filledPrompt)
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSave = async (content: string, id: string) => {
    setSavingId(id)
    await onSaveMessage(content)
    setSavingId(null)
    toast.success('Message saved')
  }

  const suggestedPrompts = suggestedPromptsByStatus[application.status]

  return (
    <div className="flex flex-col h-full">
      {/* Context Banner */}
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <p className="text-xs text-content-secondary">
          <MessageSquare className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Helping with{' '}
          <span className="font-medium text-content-primary">{application.position}</span>
          {' '}at{' '}
          <span className="font-medium text-content-primary">{application.company}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-10 h-10 text-content-tertiary mb-2" />
            <p className="text-sm text-content-secondary mb-0.5">
              Ask me anything about this application
            </p>
            <p className="text-xs text-content-tertiary">
              I can help with interview prep, follow-ups, and more
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-bright-green text-forest-green rounded-br-sm'
                    : 'bg-muted text-content-primary rounded-bl-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(message.content, message.id)}
                      disabled={savingId === message.id}
                      className="h-6 px-2 text-xs text-content-tertiary hover:text-content-primary"
                    >
                      {savingId === message.id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Bookmark className="w-3 h-3 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className="h-6 px-2 text-xs text-content-tertiary hover:text-content-primary"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-content-secondary">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this role..."
            rows={1}
            disabled={isLoading}
            className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-content-primary placeholder:text-content-tertiary focus:border-forest-green focus:ring-1 focus:ring-forest-green resize-none min-h-[42px] max-h-[100px]"
            style={{ height: 'auto' }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[42px] w-[42px] bg-bright-green hover:bg-[#8AD960] text-forest-green rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Suggested Prompts */}
        {messages.length === 0 && (
          <div className="mt-2.5">
            <p className="text-xs text-content-tertiary mb-1.5">Suggested:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-xs rounded-full border border-border text-content-secondary hover:border-accent-green hover:text-accent-green transition-colors disabled:opacity-50"
                >
                  {prompt
                    .replace('{company}', application.company)
                    .replace('{position}', application.position)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
