'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { saveMessage, removeSavedMessage } from '@/actions/saved-messages'
import { ApplicationHeader } from '@/components/applications/application-header'
import { ApplicationDetails } from '@/components/applications/application-details'
import { ApplicationNotes } from '@/components/applications/application-notes'
import { SavedMessages } from '@/components/applications/saved-messages'
import { ApplicationEditForm } from '@/components/applications/application-edit-form'
import { ApplicationChat } from '@/components/applications/application-chat'
import type { Application } from '@/types/database'

type MobileTab = 'details' | 'chat'

// Application with required id (validated by server component)
type ValidatedApplication = Application & { id: string }

interface ApplicationDetailClientProps {
  initialApplication: ValidatedApplication
}

export function ApplicationDetailClient({ initialApplication }: ApplicationDetailClientProps) {
  const router = useRouter()
  const [application, setApplication] = useState<ValidatedApplication>(initialApplication)
  const [isEditing, setIsEditing] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('details')

  const handleDelete = async () => {
    const supabase = createClient()

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application.id)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Application deleted')
    router.push('/tracker')
  }

  const handleSaveChanges = async (data: Partial<Application>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('applications')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id)

    if (error) {
      toast.error(error.message)
      return
    }

    // Update local state
    setApplication((prev) => ({ ...prev, ...data }))
    setIsEditing(false)
    toast.success('Application updated')
  }

  const handleSaveNotes = async (notes: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('applications')
      .update({
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id)

    if (error) {
      toast.error(error.message)
      return
    }

    setApplication((prev) => ({ ...prev, notes: notes || null }))
    toast.success('Notes saved')
  }

  const handleSaveMessage = async (content: string) => {
    const result = await saveMessage(application.id, content)

    if (!result.success) {
      toast.error(result.error || 'Failed to save message')
      return
    }

    // Update local state
    setApplication((prev) => {
      if (!result.message) return prev
      const existingMessages = prev.saved_messages || []
      return {
        ...prev,
        saved_messages: [...existingMessages, result.message],
      }
    })
  }

  const handleRemoveSavedMessage = async (messageId: string) => {
    const result = await removeSavedMessage(application.id, messageId)

    if (!result.success) {
      toast.error(result.error || 'Failed to remove message')
      return
    }

    // Update local state
    setApplication((prev) => {
      const existingMessages = prev.saved_messages || []
      return {
        ...prev,
        saved_messages: existingMessages.filter((m) => m.id !== messageId),
      }
    })

    toast.success('Message removed')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Tab Switcher */}
        <div className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="flex">
            <button
              onClick={() => setMobileTab('details')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileTab === 'details'
                  ? 'text-accent-green border-b-2 border-accent-green'
                  : 'text-content-secondary'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileTab === 'chat'
                  ? 'text-accent-green border-b-2 border-accent-green'
                  : 'text-content-secondary'
              }`}
            >
              AI Chat
            </button>
          </div>
        </div>

        {/* Mobile Tab Content */}
        {mobileTab === 'chat' ? (
          <div className="h-[calc(100vh-112px)]">
            <ApplicationChat
              application={application}
              onSaveMessage={handleSaveMessage}
            />
          </div>
        ) : (
          <div className="p-4 pb-24 space-y-4">
            {isEditing ? (
              <ApplicationEditForm
                application={application}
                onSave={handleSaveChanges}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <ApplicationHeader
                  application={application}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDelete}
                />
                <ApplicationDetails application={application} />
                <ApplicationNotes
                  notes={application.notes}
                  onSave={handleSaveNotes}
                />
                <SavedMessages
                  messages={application.saved_messages || []}
                  onRemove={handleRemoveSavedMessage}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop Layout - Two Columns */}
      <div className="hidden lg:flex h-screen">
        {/* Left Column - Scrollable */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {isEditing ? (
              <>
                <ApplicationHeader
                  application={application}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDelete}
                />
                <ApplicationEditForm
                  application={application}
                  onSave={handleSaveChanges}
                  onCancel={() => setIsEditing(false)}
                />
              </>
            ) : (
              <>
                <ApplicationHeader
                  application={application}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDelete}
                />
                <ApplicationDetails application={application} />
                <ApplicationNotes
                  notes={application.notes}
                  onSave={handleSaveNotes}
                />
                <SavedMessages
                  messages={application.saved_messages || []}
                  onRemove={handleRemoveSavedMessage}
                />
              </>
            )}
          </div>
        </div>

        {/* Right Column - AI Chat (Sticky) */}
        <div className="w-[450px] flex-shrink-0 bg-card flex flex-col h-screen">
          <ApplicationChat
            application={application}
            onSaveMessage={handleSaveMessage}
          />
        </div>
      </div>
    </div>
  )
}
