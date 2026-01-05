'use client'

import Link from 'next/link'
import { ArrowLeft, Trash2, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import type { Application, ApplicationStatus } from '@/types/database'

const statusColors: Record<ApplicationStatus, string> = {
  Saved: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function getRelativeTime(dateString: string | null): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Applied today'
  if (diffDays === 1) return 'Applied yesterday'
  if (diffDays < 7) return `Applied ${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Applied ${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `Applied ${months} month${months > 1 ? 's' : ''} ago`
  }
  const years = Math.floor(diffDays / 365)
  return `Applied ${years} year${years > 1 ? 's' : ''} ago`
}

interface ApplicationHeaderProps {
  application: Application
  onEdit: () => void
  onDelete: () => Promise<void>
}

export function ApplicationHeader({ application, onEdit, onDelete }: ApplicationHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete()
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/tracker"
            className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Header Content */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl font-bold text-content-primary truncate">
                {application.company}
              </h1>
              <p className="text-base text-content-secondary truncate">
                {application.position}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge className={statusColors[application.status]}>
                  {application.status}
                </Badge>
                {application.applied_date && (
                  <span className="text-xs text-content-tertiary">
                    {getRelativeTime(application.applied_date)}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-shrink-0 border-accent-green text-accent-green hover:bg-[rgba(22,51,0,0.08)] dark:hover:bg-[rgba(159,232,112,0.08)]"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your application for &quot;{application.position}&quot; at &quot;{application.company}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
