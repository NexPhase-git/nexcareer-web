/**
 * ChatMessage entity
 * Represents a message in the AI assistant conversation
 */
export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp: Date
}

export function createChatMessage(role: ChatRole, content: string): ChatMessage {
  return {
    role,
    content,
    timestamp: new Date(),
  }
}

export function createUserMessage(content: string): ChatMessage {
  return createChatMessage('user', content)
}

export function createAssistantMessage(content: string): ChatMessage {
  return createChatMessage('assistant', content)
}

export function createSystemMessage(content: string): ChatMessage {
  return createChatMessage('system', content)
}
