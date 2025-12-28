'use client'

import { MessageSquare } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'

export default function AssistantPage() {
  return (
    <AppShell title="AI Assistant">
      <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
        <div className="p-6 rounded-full bg-[rgba(22,51,0,0.08)] mb-6">
          <MessageSquare className="w-16 h-16 text-forest-green" />
        </div>
        <h2 className="text-xl font-bold text-content-primary mb-2">
          AI Assistant
        </h2>
        <p className="text-content-secondary mb-6 max-w-sm">
          Coming soon! Get personalized career advice, job search tips, and application help.
        </p>
      </div>
    </AppShell>
  )
}
