import Papa from 'papaparse'
import type { ApplicationStatus } from '@nexcareer/core'

export interface ParsedCSVRow {
  company: string
  position: string
  status: ApplicationStatus
  applied_date: string | null
  url: string | null
  notes: string | null
}

export interface CSVParseResult {
  success: boolean
  rows: ParsedCSVRow[]
  headers: string[]
  rawData: Record<string, string>[]
  error?: string
}

// Common header variations mapping
const headerMappings: Record<string, string> = {
  // Company variations
  company: 'company',
  'company name': 'company',
  companyname: 'company',
  employer: 'company',
  organization: 'company',
  org: 'company',

  // Position variations
  position: 'position',
  'job title': 'position',
  jobtitle: 'position',
  title: 'position',
  role: 'position',
  'job role': 'position',

  // Status variations
  status: 'status',
  'application status': 'status',
  state: 'status',
  stage: 'status',

  // Date variations
  applied_date: 'applied_date',
  applieddate: 'applied_date',
  'applied date': 'applied_date',
  'date applied': 'applied_date',
  dateapplied: 'applied_date',
  date: 'applied_date',
  'application date': 'applied_date',

  // URL variations
  url: 'url',
  link: 'url',
  'job url': 'url',
  joburl: 'url',
  'job link': 'url',
  joblink: 'url',
  website: 'url',

  // Notes variations
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
  comment: 'notes',
  description: 'notes',
  details: 'notes',
}

// Normalize header to standard field name
function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().trim()
  return headerMappings[normalized] || normalized
}

// Normalize status value
function normalizeStatus(value: string | undefined | null): ApplicationStatus {
  if (!value) return 'Saved'

  const normalized = value.trim().toLowerCase()

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

export function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            rows: [],
            headers: [],
            rawData: [],
            error: results.errors[0].message,
          })
          return
        }

        const rawData = results.data as Record<string, string>[]
        const headers = results.meta.fields || []

        // Create header mapping
        const headerMap: Record<string, string> = {}
        headers.forEach((header) => {
          headerMap[header] = normalizeHeader(header)
        })

        // Transform rows
        const rows: ParsedCSVRow[] = rawData.map((row) => {
          const mappedRow: Record<string, string> = {}

          // Map original headers to normalized headers
          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = headerMap[key]
            if (normalizedKey && value) {
              mappedRow[normalizedKey] = value
            }
          })

          return {
            company: mappedRow.company || '',
            position: mappedRow.position || '',
            status: normalizeStatus(mappedRow.status),
            applied_date: mappedRow.applied_date || null,
            url: mappedRow.url || null,
            notes: mappedRow.notes || null,
          }
        })

        resolve({
          success: true,
          rows,
          headers,
          rawData,
        })
      },
      error: (error) => {
        resolve({
          success: false,
          rows: [],
          headers: [],
          rawData: [],
          error: error.message,
        })
      },
    })
  })
}
