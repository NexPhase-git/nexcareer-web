'use client'

import { GraduationCap } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'

export default function CoachPage() {
  return (
    <AppShell title="Interview Coach">
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
        <div className="p-6 rounded-full bg-[rgba(22,51,0,0.08)] mb-6">
          <GraduationCap className="w-16 h-16 text-forest-green" />
        </div>
        <h2 className="text-xl font-bold text-content-primary mb-2">
          Interview Coach
        </h2>
        <p className="text-content-secondary mb-6 max-w-sm">
          Coming soon! Practice interviews with AI-generated questions and get instant feedback.
        </p>
      </div>
    </AppShell>
  )
}
