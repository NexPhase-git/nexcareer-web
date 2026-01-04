'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import type { WeeklyDataPoint } from '@/actions/analytics'

interface WeeklyChartProps {
  data: WeeklyDataPoint[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const yAxisMax = Math.ceil(maxCount * 1.2) || 5

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <h3 className="text-base font-semibold text-content-primary mb-4">
          Applications Over Time
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(0,0,0,0.1)"
                className="dark:stroke-[rgba(255,255,255,0.1)]"
              />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6A6C6A' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6A6C6A' }}
                domain={[0, yAxisMax]}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(22, 51, 0, 0.05)' }}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'var(--content-primary)', fontWeight: 600 }}
                itemStyle={{ color: 'var(--content-secondary)' }}
                formatter={(value) => [`${value} applications`, 'Count']}
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <Bar
                dataKey="count"
                fill="#9FE870"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-content-tertiary mt-2 text-center">
          Last 8 weeks
        </p>
      </CardContent>
    </Card>
  )
}
