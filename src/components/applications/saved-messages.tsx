'use client'

import { useState } from 'react'
import { Bookmark, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SavedMessage } from '@/types/database'

interface SavedMessagesProps {
  messages: SavedMessage[]
  onRemove: (messageId: string) => Promise<void>
}

function MessageItem({
  message,
  onRemove,
}: {
  message: SavedMessage
  onRemove: (id: string) => Promise<void>
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const isLong = message.content.length > 150
  const displayContent = isLong && !isExpanded
    ? message.content.substring(0, 150) + '...'
    : message.content

  const handleRemove = async () => {
    setIsRemoving(true)
    await onRemove(message.id)
    setIsRemoving(false)
  }

  const savedDate = new Date(message.saved_at)
  const formattedDate = savedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-muted rounded-lg p-3 relative group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-content-primary whitespace-pre-wrap flex-1 leading-relaxed">
          {displayContent}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-content-tertiary hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex-shrink-0"
        >
          {isRemoving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <X className="w-3 h-3" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-content-tertiary">
          Saved {formattedDate}
        </span>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-accent-green hover:underline inline-flex items-center gap-0.5"
          >
            {isExpanded ? (
              <>
                Less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                More <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export function SavedMessages({ messages, onRemove }: SavedMessagesProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3">
          Saved from AI
        </h3>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Bookmark className="w-6 h-6 text-content-tertiary mb-2" />
            <p className="text-xs text-content-tertiary">
              Save helpful AI responses to reference later
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
