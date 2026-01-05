'use server'

import { createClient } from '@/lib/supabase/server'
import type { SavedMessage } from '@/types/database'

export async function saveMessage(
  applicationId: string,
  content: string
): Promise<{ success: boolean; message?: SavedMessage; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('saved_messages')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !application) {
      return { success: false, error: 'Application not found' }
    }

    const existingMessages: SavedMessage[] = application.saved_messages || []

    const newMessage: SavedMessage = {
      id: crypto.randomUUID(),
      content,
      saved_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        saved_messages: [...existingMessages, newMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, message: newMessage }
  } catch (error) {
    console.error('Save message error:', error)
    return { success: false, error: 'Failed to save message' }
  }
}

export async function removeSavedMessage(
  applicationId: string,
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('saved_messages')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !application) {
      return { success: false, error: 'Application not found' }
    }

    const existingMessages: SavedMessage[] = application.saved_messages || []
    const filteredMessages = existingMessages.filter((m) => m.id !== messageId)

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        saved_messages: filteredMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Remove message error:', error)
    return { success: false, error: 'Failed to remove message' }
  }
}
