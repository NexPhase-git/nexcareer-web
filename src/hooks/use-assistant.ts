'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type ChatMessage } from '@nexcareer/core'

const MAX_CHARACTERS = 500
const COOLDOWN_MS = 2000

export interface UseAssistantReturn {
  messages: ChatMessage[]
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  isCooldown: boolean
  suggestedPrompts: string[]
  isLoadingPrompts: boolean
  canSend: boolean
  isOverLimit: boolean
  sendMessage: (text?: string) => Promise<void>
  resetChat: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  maxCharacters: number
}

/**
 * Hook for managing AI assistant chat
 */
export function useAssistant(): UseAssistantReturn {
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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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

  const canSend = !isLoading && !isCooldown && input.length <= MAX_CHARACTERS
  const isOverLimit = input.length > MAX_CHARACTERS

  const startCooldown = useCallback(() => {
    setIsCooldown(true)
    setTimeout(() => setIsCooldown(false), COOLDOWN_MS)
  }, [])

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim()
      if (!messageText || isLoading || isCooldown) return

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
          console.error('Chat error:', data.error)
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMessage])
        } else {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
          startCooldown()
        }
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
    },
    [input, isLoading, isCooldown, messages, startCooldown]
  )

  const resetChat = useCallback(() => {
    setMessages([])
    loadSuggestedPrompts()
  }, [])

  return {
    messages,
    input,
    setInput,
    isLoading,
    isCooldown,
    suggestedPrompts,
    isLoadingPrompts,
    canSend,
    isOverLimit,
    sendMessage,
    resetChat,
    scrollRef,
    inputRef,
    maxCharacters: MAX_CHARACTERS,
  }
}
