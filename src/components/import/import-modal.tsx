'use client'

import { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { parseCSV, type ParsedCSVRow } from '@/lib/csv-parser'
import { importApplications, type ImportRow } from '@/actions/import'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    const result = await parseCSV(selectedFile)

    if (!result.success) {
      toast.error(result.error || 'Failed to parse CSV')
      return
    }

    if (result.rows.length === 0) {
      toast.error('No data found in CSV')
      return
    }

    setParsedRows(result.rows)
    setStep('preview')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleImport = async () => {
    setStep('importing')

    const result = await importApplications(parsedRows as ImportRow[])

    setImportResult({
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    })

    setStep('done')

    if (result.success && result.imported > 0) {
      onSuccess?.()
    }
  }

  const handleClose = () => {
    // Reset state
    setStep('upload')
    setParsedRows([])
    setImportResult(null)
    onClose()
  }

  const validRows = parsedRows.filter((row) => row.company && row.position)
  const invalidRows = parsedRows.length - validRows.length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent-green" />
            Import Applications
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import your job applications'}
            {step === 'preview' && 'Review the data before importing'}
            {step === 'importing' && 'Importing your applications...'}
            {step === 'done' && 'Import complete'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-accent-green bg-[rgba(22,51,0,0.04)] dark:bg-[rgba(159,232,112,0.08)]'
                    : 'border-border hover:border-accent-green hover:bg-muted'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
                <Upload className="w-10 h-10 mx-auto text-content-tertiary mb-3" />
                <p className="text-sm font-medium text-content-primary">
                  Drop your CSV file here
                </p>
                <p className="text-xs text-content-secondary mt-1">
                  or click to browse
                </p>
              </div>

              {/* Expected Format */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">
                  Expected CSV Format
                </p>
                <code className="text-xs text-content-primary block overflow-x-auto whitespace-pre">
{`company,position,status,applied_date,url,notes
Stripe,Software Engineer,Applied,2025-01-01,https://...,Referral
Google,PM,Interview,2024-12-15,https://...,Second round`}
                </code>
                <p className="text-xs text-content-tertiary mt-2">
                  Required: company, position. Optional: status (defaults to Saved), applied_date, url, notes
                </p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-content-primary">
                    {validRows.length} valid row{validRows.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {invalidRows > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-content-secondary">
                      {invalidRows} will be skipped (missing company or position)
                    </span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-3 py-2 text-left font-medium text-content-secondary">Company</th>
                        <th className="px-3 py-2 text-left font-medium text-content-secondary">Position</th>
                        <th className="px-3 py-2 text-left font-medium text-content-secondary">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-content-secondary">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.slice(0, 5).map((row, idx) => {
                        const isValid = row.company && row.position
                        return (
                          <tr
                            key={idx}
                            className={!isValid ? 'bg-red-50 dark:bg-red-900/10' : ''}
                          >
                            <td className="px-3 py-2 text-content-primary">
                              {row.company || <span className="text-red-500">Missing</span>}
                            </td>
                            <td className="px-3 py-2 text-content-primary">
                              {row.position || <span className="text-red-500">Missing</span>}
                            </td>
                            <td className="px-3 py-2 text-content-secondary">{row.status}</td>
                            <td className="px-3 py-2 text-content-secondary">
                              {row.applied_date || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 5 && (
                  <div className="px-3 py-2 bg-muted text-xs text-content-tertiary text-center">
                    And {parsedRows.length - 5} more row{parsedRows.length - 5 !== 1 ? 's' : ''}...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="py-8 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-accent-green mx-auto mb-4" />
              <p className="text-content-primary font-medium">
                Importing {validRows.length} application{validRows.length !== 1 ? 's' : ''}...
              </p>
              <p className="text-sm text-content-secondary mt-1">
                Please wait
              </p>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && importResult && (
            <div className="space-y-4">
              {/* Success/Error Banner */}
              <div
                className={`p-4 rounded-lg ${
                  importResult.imported > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {importResult.imported > 0 ? (
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      importResult.imported > 0
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {importResult.imported > 0
                        ? `Successfully imported ${importResult.imported} application${importResult.imported !== 1 ? 's' : ''}`
                        : 'Import failed'}
                    </p>
                    {importResult.skipped > 0 && (
                      <p className="text-sm text-content-secondary mt-1">
                        {importResult.skipped} row{importResult.skipped !== 1 ? 's' : ''} skipped
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">
                    Issues
                  </p>
                  <ul className="space-y-1">
                    {importResult.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="text-xs text-content-secondary flex items-start gap-2">
                        <X className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-xs text-content-tertiary">
                        And {importResult.errors.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="bg-bright-green hover:bg-[#8AD960] text-forest-green"
              >
                Import {validRows.length} Application{validRows.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}

          {step === 'done' && (
            <Button
              onClick={handleClose}
              className="bg-bright-green hover:bg-[#8AD960] text-forest-green"
            >
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
