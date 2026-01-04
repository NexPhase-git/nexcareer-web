'use client'

import { FileText, TrendingUp, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AnalyticsData } from '@/actions/analytics'

interface StatsCardsProps {
  data: AnalyticsData
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  subValue?: string
  trend?: 'up' | 'down' | 'same'
}

function StatCard({ icon, value, label, subValue, trend }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)]">
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-content-primary">{value}</p>
              <p className="text-sm text-content-secondary">{label}</p>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-content-tertiary'
            }`}>
              {trend === 'up' && <ArrowUp className="w-3 h-3" />}
              {trend === 'down' && <ArrowDown className="w-3 h-3" />}
              {trend === 'same' && <Minus className="w-3 h-3" />}
              {subValue}
            </div>
          )}
        </div>
        {!trend && subValue && (
          <p className="text-xs text-content-tertiary mt-2">{subValue}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsCards({ data }: StatsCardsProps) {
  const trendDiff = data.thisWeekCount - data.lastWeekCount
  const trendText = trendDiff === 0 ? 'Same as last week' :
    trendDiff > 0 ? `+${trendDiff} from last week` :
    `${trendDiff} from last week`

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FileText className="w-5 h-5 text-accent-green" />}
        value={String(data.totalApplications)}
        label="Total Applications"
        subValue="All time"
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5 text-accent-green" />}
        value={`${data.responseRate}%`}
        label="Response Rate"
        subValue="Interviews + Offers"
      />
      <StatCard
        icon={<Clock className="w-5 h-5 text-accent-green" />}
        value={data.avgDaysToResponse !== null ? `${data.avgDaysToResponse}d` : '-'}
        label="Avg. Response Time"
        subValue={data.avgDaysToResponse !== null ? 'Days to response' : 'No data yet'}
      />
      <StatCard
        icon={<FileText className="w-5 h-5 text-accent-green" />}
        value={String(data.thisWeekCount)}
        label="This Week"
        subValue={trendText}
        trend={data.weeklyTrend}
      />
    </div>
  )
}
