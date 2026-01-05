'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('details')

  const loadApplication = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (error || !data) {
      toast.error('Application not found')
      router.push('/tracker')
      return
    }

    setApplication(data as Application)
    setIsLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      await loadApplication()
      if (!isMounted) return
    }
    fetchData()
    return () => { isMounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  const handleDelete = async () => {
    const supabase = createClient()

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)

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
      .eq('id', applicationId)

    if (error) {
      toast.error(error.message)
      return
    }

    // Update local state
    setApplication((prev) => (prev ? { ...prev, ...data } : null))
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
      .eq('id', applicationId)

    if (error) {
      toast.error(error.message)
      return
    }

    setApplication((prev) => (prev ? { ...prev, notes: notes || null } : null))
    toast.success('Notes saved')
  }

  const handleSaveMessage = async (content: string) => {
    const result = await saveMessage(applicationId, content)

    if (!result.success) {
      toast.error(result.error || 'Failed to save message')
      return
    }

    // Update local state
    setApplication((prev) => {
      if (!prev || !result.message) return prev
      const existingMessages = prev.saved_messages || []
      return {
        ...prev,
        saved_messages: [...existingMessages, result.message],
      }
    })
  }

  const handleRemoveSavedMessage = async (messageId: string) => {
    const result = await removeSavedMessage(applicationId, messageId)

    if (!result.success) {
      toast.error(result.error || 'Failed to remove message')
      return
    }

    // Update local state
    setApplication((prev) => {
      if (!prev) return prev
      const existingMessages = prev.saved_messages || []
      return {
        ...prev,
        saved_messages: existingMessages.filter((m) => m.id !== messageId),
      }
    })

    toast.success('Message removed')
  }

  if (isLoading || !application) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
      </div>
    )
  }

  // Mobile Tab Content
  const MobileTabContent = () => {
    if (mobileTab === 'chat') {
      return (
        <div className="h-[calc(100vh-112px)]">
          <ApplicationChat
            application={application}
            onSaveMessage={handleSaveMessage}
          />
        </div>
      )
    }

    return (
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
    )
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

        <MobileTabContent />
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
