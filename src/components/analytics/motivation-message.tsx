'use client'

import { Sparkles, Flame, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface MotivationMessageProps {
  thisWeekCount: number
}

export function MotivationMessage({ thisWeekCount }: MotivationMessageProps) {
  const getMessage = () => {
    if (thisWeekCount === 0) {
      return {
        icon: <Target className="w-5 h-5 text-amber-500" />,
        title: "No applications yet this week",
        message: "Let's change that! Every application brings you closer to your dream job.",
        bgClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      }
    }
    if (thisWeekCount >= 1 && thisWeekCount <= 4) {
      return {
        icon: <Sparkles className="w-5 h-5 text-accent-green" />,
        title: "Good start!",
        message: `You've submitted ${thisWeekCount} application${thisWeekCount > 1 ? 's' : ''} this week. Keep the momentum going!`,
        bgClass: 'bg-[rgba(22,51,0,0.04)] dark:bg-[rgba(159,232,112,0.08)] border-[rgba(22,51,0,0.12)] dark:border-[rgba(159,232,112,0.2)]',
      }
    }
    return {
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      title: "You're on fire!",
      message: `${thisWeekCount} applications this week! Your persistence will pay off.`,
      bgClass: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    }
  }

  const { icon, title, message, bgClass } = getMessage()

  return (
    <Card className={`border ${bgClass}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <p className="font-semibold text-content-primary">{title}</p>
            <p className="text-sm text-content-secondary mt-1">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
