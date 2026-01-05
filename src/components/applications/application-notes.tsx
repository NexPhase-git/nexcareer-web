'use client'

import { useState } from 'react'
import { Edit, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ApplicationNotesProps {
  notes: string | null
  onSave: (notes: string) => Promise<void>
}

export function ApplicationNotes({ notes, onSave }: ApplicationNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(notes || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(editedNotes)
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedNotes(notes || '')
    setIsEditing(false)
  }

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
            Notes
          </h3>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0 text-content-tertiary hover:text-content-primary"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-content-primary placeholder:text-content-tertiary focus:border-forest-green focus:ring-1 focus:ring-forest-green resize-none"
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 text-sm"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 text-sm bg-bright-green hover:bg-[#8AD960] text-forest-green"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        ) : notes ? (
          <p className="text-sm text-content-primary whitespace-pre-wrap leading-relaxed">
            {notes}
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <FileText className="w-6 h-6 text-content-tertiary mb-2" />
            <p className="text-xs text-content-tertiary">
              No notes yet. Click edit to add.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
