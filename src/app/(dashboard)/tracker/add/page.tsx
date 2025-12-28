'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Link as LinkIcon,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ApplicationStatus, APPLICATION_STATUSES } from '@/types/database'

const statusOptions: ApplicationStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

export default function AddApplicationPage() {
  const router = useRouter()
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('Applied')
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0])
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in to add applications')
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        company: company.trim(),
        position: position.trim(),
        status,
        applied_date: appliedDate || null,
        url: url.trim() || null,
        notes: notes.trim() || null,
      })

    setIsSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Application added successfully!')
    router.push('/tracker')
  }

  return (
    <AppShell title="Add Application">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-[600px] mx-auto">
          {/* Back button */}
          <Link
            href="/tracker"
            className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>

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
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

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
                    'Add Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
