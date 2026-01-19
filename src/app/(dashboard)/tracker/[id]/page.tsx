'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Link as LinkIcon,
  Calendar,
  Loader2,
  Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useCurrentUser, useApplication, useApplications } from '@/hooks'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@nexcareer/core'

export default function EditApplicationPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const { user, isLoading: isLoadingUser } = useCurrentUser({ redirectTo: '/login' })
  const { application, isLoading: isLoadingApp } = useApplication(applicationId, user?.id ?? null)
  const { updateApplication, deleteApplication } = useApplications({
    userId: user?.id ?? null,
    autoLoad: false,
  })

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('Applied')
  const [appliedDate, setAppliedDate] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Populate form when application is loaded
  useEffect(() => {
    if (application) {
      setCompany(application.company)
      setPosition(application.position)
      setStatus(application.status)
      setAppliedDate(application.appliedDate?.toISOString().split('T')[0] || '')
      setInterviewDate(application.interviewDate?.toISOString().split('T')[0] || '')
      setUrl(application.url || '')
      setNotes(application.notes || '')
    }
  }, [application])

  // Handle application not found
  useEffect(() => {
    if (!isLoadingUser && !isLoadingApp && !application && user) {
      toast.error('Application not found')
      router.push('/tracker')
    }
  }, [isLoadingUser, isLoadingApp, application, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!company.trim()) {
      toast.error('Company name is required')
      return
    }

    if (!position.trim()) {
      toast.error('Position is required')
      return
    }

    setIsSaving(true)

    try {
      await updateApplication(applicationId, {
        company: company.trim(),
        position: position.trim(),
        status,
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        notes: notes.trim() || null,
        url: url.trim() || null,
      })

      toast.success('Application updated successfully!')
      router.push('/tracker')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update application')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteApplication(applicationId)
      toast.success('Application deleted')
      router.push('/tracker')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete application')
    } finally {
      setIsDeleting(false)
    }
  }

  const isLoading = isLoadingUser || isLoadingApp

  if (isLoading) {
    return (
      <AppShell title="Edit Application">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Edit Application">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-[600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Applications
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Form Card */}
          <Card className="border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-content-primary">
                    Company *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      type="text"
                      placeholder="e.g., Google, Microsoft"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-content-primary">
                    Position *
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      type="text"
                      placeholder="e.g., Software Engineer"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-content-primary">
                    Status
                  </Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-background text-content-primary focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interview Date - only shown when status is Interview */}
                {status === 'Interview' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-content-primary">
                      Interview Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                      <Input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                    <p className="text-xs text-content-tertiary">
                      Set this to receive a reminder before your interview
                    </p>
                  </div>
                )}

                {/* Applied Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-content-primary">
                    Applied Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      type="date"
                      value={appliedDate}
                      onChange={(e) => setAppliedDate(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Job URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-content-primary">
                    Job URL (optional)
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-content-primary">
                    Notes (optional)
                  </Label>
                  <textarea
                    placeholder="Any additional notes about this application..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-content-primary placeholder:text-content-tertiary focus:border-forest-green focus:ring-1 focus:ring-forest-green resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-12 text-base font-medium bg-bright-green hover:bg-[#8AD960] text-forest-green"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the application for &quot;{position}&quot; at &quot;{company}&quot;? This action cannot be undone.
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
              className="bg-destructive hover:bg-destructive/90"
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
    </AppShell>
  )
}
