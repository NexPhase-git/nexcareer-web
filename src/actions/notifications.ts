'use server'

import { createClient } from '@/lib/supabase/server'
import type { Application } from '@/types/database'

export type NotificationType = 'follow_up' | 'stale' | 'upcoming_interview'

export interface Notification {
  id: string
  type: NotificationType
  application: Application
  daysSinceApplied: number
  daysUntilInterview?: number
  message: string
}

export interface NotificationsData {
  notifications: Notification[]
  count: number
}

export async function getNotifications(): Promise<NotificationsData | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch applications that might need notifications
  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['Applied', 'Interview'])

  if (error || !applications) {
    console.error('Error fetching applications:', error)
    return { notifications: [], count: 0 }
  }

  const notifications: Notification[] = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  applications.forEach((app) => {
    const application = app as Application

    // Calculate days since applied
    let daysSinceApplied = 0
    if (application.applied_date) {
      const appliedDate = new Date(application.applied_date)
      daysSinceApplied = Math.floor(
        (today.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    } else if (application.created_at) {
      const createdDate = new Date(application.created_at)
      daysSinceApplied = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    // Check for upcoming interviews
    if (application.status === 'Interview' && application.interview_date) {
      const interviewDate = new Date(application.interview_date)
      const daysUntil = Math.ceil(
        (interviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntil >= 0 && daysUntil <= 3) {
        notifications.push({
          id: `interview-${application.id}`,
          type: 'upcoming_interview',
          application,
          daysSinceApplied,
          daysUntilInterview: daysUntil,
          message: daysUntil === 0
            ? 'Interview today!'
            : daysUntil === 1
              ? 'Interview tomorrow'
              : `Interview in ${daysUntil} days`,
        })
      }
    }

    // Check for follow-up needed (7+ days, status = Applied, not followed up)
    if (
      application.status === 'Applied' &&
      daysSinceApplied >= 7 &&
      !application.followed_up_at
    ) {
      // Stale applications (14+ days) get higher priority
      if (daysSinceApplied >= 14) {
        notifications.push({
          id: `stale-${application.id}`,
          type: 'stale',
          application,
          daysSinceApplied,
          message: `No response for ${daysSinceApplied} days`,
        })
      } else {
        notifications.push({
          id: `followup-${application.id}`,
          type: 'follow_up',
          application,
          daysSinceApplied,
          message: `Applied ${daysSinceApplied} days ago`,
        })
      }
    }
  })

  // Sort by priority: upcoming_interview > stale > follow_up
  const priorityOrder: Record<NotificationType, number> = {
    upcoming_interview: 0,
    stale: 1,
    follow_up: 2,
  }

  notifications.sort((a, b) => {
    const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type]
    if (priorityDiff !== 0) return priorityDiff
    // Within same type, sort by urgency (days)
    if (a.type === 'upcoming_interview') {
      return (a.daysUntilInterview || 0) - (b.daysUntilInterview || 0)
    }
    return b.daysSinceApplied - a.daysSinceApplied
  })

  return {
    notifications,
    count: notifications.length,
  }
}

export async function markAsFollowedUp(applicationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('applications')
    .update({ followed_up_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('user_id', user.id) // Security: ensure user owns this application

  if (error) {
    console.error('Error marking as followed up:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
