'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { StatsCards } from '@/components/analytics/stats-cards'
import { WeeklyChart } from '@/components/analytics/weekly-chart'
import { MotivationMessage } from '@/components/analytics/motivation-message'
import { getAnalytics, type AnalyticsData } from '@/actions/analytics'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      const analyticsData = await getAnalytics()
      if (!isMounted) return
      if (!analyticsData) {
        router.push('/login')
        return
      }
      setData(analyticsData)
      setIsLoading(false)
    }
    fetchData()
    return () => { isMounted = false }
  }, [router])

  if (isLoading) {
    return (
      <AppShell title="Analytics">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell title="Analytics">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <BarChart3 className="w-16 h-16 text-content-tertiary mb-4" />
          <h2 className="text-xl font-semibold text-content-primary mb-2">
            No Data Available
          </h2>
          <p className="text-content-secondary mb-4">
            Start tracking applications to see your analytics
          </p>
          <Link href="/tracker/add">
            <Button className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
              Add Your First Application
            </Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Analytics">
      <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Analytics</h1>
            <p className="text-sm text-content-secondary">
              Track your job search progress
            </p>
          </div>
        </div>

        {/* Motivation Message */}
        <MotivationMessage thisWeekCount={data.thisWeekCount} />

        {/* Stats Cards */}
        <StatsCards data={data} />

        {/* Weekly Chart */}
        <WeeklyChart data={data.weeklyData} />
      </div>
    </AppShell>
  )
}
