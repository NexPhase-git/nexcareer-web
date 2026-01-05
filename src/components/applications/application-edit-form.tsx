'use client'

import { useState } from 'react'
import {
  Building2,
  Briefcase,
  Link as LinkIcon,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import type { Application, ApplicationStatus } from '@/types/database'

const statusOptions: ApplicationStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

interface ApplicationEditFormProps {
  application: Application
  onSave: (data: Partial<Application>) => Promise<void>
  onCancel: () => void
}

export function ApplicationEditForm({
  application,
  onSave,
  onCancel,
}: ApplicationEditFormProps) {
  const [company, setCompany] = useState(application.company)
  const [position, setPosition] = useState(application.position)
  const [status, setStatus] = useState<ApplicationStatus>(application.status)
  const [appliedDate, setAppliedDate] = useState(application.applied_date || '')
  const [interviewDate, setInterviewDate] = useState(application.interview_date || '')
  const [url, setUrl] = useState(application.url || '')
  const [notes, setNotes] = useState(application.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!company.trim()) {
      setError('Company name is required')
      return
    }

    if (!position.trim()) {
      setError('Position is required')
      return
    }

    setIsSaving(true)

    await onSave({
      company: company.trim(),
      position: position.trim(),
      status,
      applied_date: appliedDate || null,
      interview_date: status === 'Interview' && interviewDate ? interviewDate : null,
      url: url.trim() || null,
      notes: notes.trim() || null,
    })

    setIsSaving(false)
  }

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Company */}
          <div className="space-y-1.5">
            <Label className="text-sm text-content-secondary">
              Company *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <Input
                type="text"
                placeholder="e.g., Google, Microsoft"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label className="text-sm text-content-secondary">
              Position *
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <Input
                type="text"
                placeholder="e.g., Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-sm text-content-secondary">
              Status
            </Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background text-content-primary focus:border-forest-green focus:ring-1 focus:ring-forest-green"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Interview Date - only shown when status is Interview */}
          {status === 'Interview' && (
            <div className="space-y-1.5">
              <Label className="text-sm text-content-secondary">
                Interview Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
                <Input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>
          )}

          {/* Applied Date */}
          <div className="space-y-1.5">
            <Label className="text-sm text-content-secondary">
              Applied Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <Input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Job URL */}
          <div className="space-y-1.5">
            <Label className="text-sm text-content-secondary">
              Job URL
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <Input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm text-content-secondary">
              Notes
            </Label>
            <textarea
              placeholder="Any additional notes about this application..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-content-primary placeholder:text-content-tertiary focus:border-forest-green focus:ring-1 focus:ring-forest-green resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-9 text-sm bg-bright-green hover:bg-[#8AD960] text-forest-green"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
