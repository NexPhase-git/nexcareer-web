'use client'

import { Calendar, ExternalLink, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Application } from '@/types/database'

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.length > 20
      ? parsed.pathname.substring(0, 20) + '...'
      : parsed.pathname
    return `${parsed.hostname}${path}`
  } catch {
    return url.length > 40 ? url.substring(0, 40) + '...' : url
  }
}

interface ApplicationDetailsProps {
  application: Application
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-4">
          Details
        </h3>

        <div className="space-y-3">
          {/* Applied Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-content-tertiary flex-shrink-0" />
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="text-sm text-content-secondary">Applied</span>
              <span className="text-sm text-content-primary">
                {formatDate(application.applied_date)}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-content-tertiary flex-shrink-0" />
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="text-sm text-content-secondary">Status</span>
              <span className="text-sm text-content-primary">{application.status}</span>
            </div>
          </div>

          {/* Interview Date (if applicable) */}
          {application.status === 'Interview' && application.interview_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-sm text-content-secondary">Interview</span>
                <span className="text-sm text-content-primary">
                  {formatDate(application.interview_date)}
                </span>
              </div>
            </div>
          )}

          {/* URL */}
          {application.url && (
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-content-tertiary flex-shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-sm text-content-secondary">Job URL</span>
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-green hover:underline inline-flex items-center gap-1 truncate max-w-[180px]"
                >
                  {truncateUrl(application.url)}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
