'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApplicationStatus } from '@nexcareer/core'

export interface AnalyticsData {
  totalApplications: number
  responseRate: number
  avgDaysToResponse: number | null
  thisWeekCount: number
  lastWeekCount: number
  weeklyTrend: 'up' | 'down' | 'same'
  weeklyData: WeeklyDataPoint[]
  statusCounts: Record<ApplicationStatus, number>
}

export interface WeeklyDataPoint {
  week: string
  count: number
  weekStart: string
}

export async function getAnalytics(): Promise<AnalyticsData | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all applications for this user
  const { data: applications, error } = await supabase
    .from('applications')
    .select('id, status, applied_date, created_at, updated_at')
    .eq('user_id', user.id)

  if (error || !applications) {
    console.error('Error fetching applications:', error)
    return null
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Calculate week boundaries
  const dayOfWeek = today.getDay()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - dayOfWeek)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1)

  // Total applications
  const totalApplications = applications.length

  // Status counts
  const statusCounts: Record<ApplicationStatus, number> = {
    Saved: 0,
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  }

  let interviewsAndOffers = 0
  let totalApplied = 0
  const responseDays: number[] = []

  applications.forEach((app) => {
    const status = app.status as ApplicationStatus
    statusCounts[status]++

    // Count for response rate calculation (excluding Saved)
    if (status !== 'Saved') {
      totalApplied++
      if (status === 'Interview' || status === 'Offer') {
        interviewsAndOffers++

        // Calculate days to response if we have applied_date and updated_at
        if (app.applied_date && app.updated_at) {
          const appliedDate = new Date(app.applied_date)
          const responseDate = new Date(app.updated_at)
          const daysDiff = Math.floor(
            (responseDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysDiff >= 0) {
            responseDays.push(daysDiff)
          }
        }
      }
    }
  })

  // Response rate
  const responseRate = totalApplied > 0
    ? Math.round((interviewsAndOffers / totalApplied) * 100)
    : 0

  // Average days to response
  const avgDaysToResponse = responseDays.length > 0
    ? Math.round(responseDays.reduce((a, b) => a + b, 0) / responseDays.length)
    : null

  // This week vs last week counts
  let thisWeekCount = 0
  let lastWeekCount = 0

  applications.forEach((app) => {
    const createdDate = new Date(app.created_at || app.applied_date || '')
    if (isNaN(createdDate.getTime())) return

    if (createdDate >= thisWeekStart) {
      thisWeekCount++
    } else if (createdDate >= lastWeekStart && createdDate <= lastWeekEnd) {
      lastWeekCount++
    }
  })

  // Weekly trend
  let weeklyTrend: 'up' | 'down' | 'same' = 'same'
  if (thisWeekCount > lastWeekCount) weeklyTrend = 'up'
  else if (thisWeekCount < lastWeekCount) weeklyTrend = 'down'

  // Weekly data for chart (last 8 weeks)
  const weeklyData: WeeklyDataPoint[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(thisWeekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const count = applications.filter((app) => {
      const createdDate = new Date(app.created_at || app.applied_date || '')
      if (isNaN(createdDate.getTime())) return false
      return createdDate >= weekStart && createdDate <= weekEnd
    }).length

    // Format week label
    const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`

    weeklyData.push({
      week: weekLabel,
      count,
      weekStart: weekStart.toISOString(),
    })
  }

  return {
    totalApplications,
    responseRate,
    avgDaysToResponse,
    thisWeekCount,
    lastWeekCount,
    weeklyTrend,
    weeklyData,
    statusCounts,
  }
}
