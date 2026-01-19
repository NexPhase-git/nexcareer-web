'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApplicationStatus } from '@nexcareer/core'

export interface ImportRow {
  company: string
  position: string
  status: ApplicationStatus
  applied_date: string | null
  url: string | null
  notes: string | null
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

// Normalize status value to valid ApplicationStatus
function normalizeStatus(value: string | undefined | null): ApplicationStatus {
  if (!value) return 'Saved'

  const normalized = value.trim().toLowerCase()

  // Map common variations
  const statusMap: Record<string, ApplicationStatus> = {
    saved: 'Saved',
    applied: 'Applied',
    interview: 'Interview',
    interviewing: 'Interview',
    offer: 'Offer',
    offered: 'Offer',
    rejected: 'Rejected',
    declined: 'Rejected',
  }

  return statusMap[normalized] || 'Saved'
}

// Parse date from various formats
function parseDate(value: string | undefined | null): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  // Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  // Try MM/DD/YYYY
  const usFormat = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usFormat) {
    const [, month, day, year] = usFormat
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Try DD/MM/YYYY
  const euFormat = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (euFormat) {
    const [, day, month, year] = euFormat
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Try parsing with Date
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }

  return null
}

export async function importApplications(rows: ImportRow[]): Promise<ImportResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, imported: 0, skipped: 0, errors: ['Not authenticated'] }
  }

  const validRows: Array<{
    user_id: string
    company: string
    position: string
    status: ApplicationStatus
    applied_date: string | null
    url: string | null
    notes: string | null
  }> = []
  const errors: string[] = []
  let skipped = 0

  rows.forEach((row, index) => {
    const rowNum = index + 1

    // Validate required fields
    if (!row.company?.trim()) {
      errors.push(`Row ${rowNum}: Missing company name`)
      skipped++
      return
    }

    if (!row.position?.trim()) {
      errors.push(`Row ${rowNum}: Missing position`)
      skipped++
      return
    }

    validRows.push({
      user_id: user.id,
      company: row.company.trim(),
      position: row.position.trim(),
      status: normalizeStatus(row.status as unknown as string),
      applied_date: parseDate(row.applied_date),
      url: row.url?.trim() || null,
      notes: row.notes?.trim() || null,
    })
  })

  if (validRows.length === 0) {
    return {
      success: false,
      imported: 0,
      skipped,
      errors: errors.length > 0 ? errors : ['No valid rows to import'],
    }
  }

  // Bulk insert
  const { error } = await supabase
    .from('applications')
    .insert(validRows)

  if (error) {
    return {
      success: false,
      imported: 0,
      skipped,
      errors: [...errors, error.message],
    }
  }

  return {
    success: true,
    imported: validRows.length,
    skipped,
    errors,
  }
}
