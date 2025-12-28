'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ResumeUploadProps {
  onSuccess?: () => void
  className?: string
  variant?: 'button' | 'card'
}

export function ResumeUpload({ onSuccess, className, variant = 'button' }: ResumeUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)

    try {
      // Extract text from PDF using pdf.js (client-side)
      // For now, we'll let the server handle the upload without text
      // In a production app, you'd use pdf.js or similar to extract text

      const formData = new FormData()
      formData.append('file', file)

      // Optional: Add text if we had client-side PDF parsing
      // formData.append('text', extractedText)

      const response = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Resume uploaded successfully!')

      if (data.profile) {
        toast.success('Profile updated with resume data!')
      }

      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume')
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (variant === 'card') {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full p-8 border-2 border-dashed border-border rounded-lg hover:border-forest-green hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-forest-green animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-content-primary">Uploading...</p>
                  <p className="text-sm text-content-secondary">
                    Processing your resume with AI
                  </p>
                </div>
              </>
            ) : selectedFile ? (
              <>
                <FileText className="w-12 h-12 text-forest-green" />
                <div className="text-center">
                  <p className="font-medium text-content-primary">{selectedFile.name}</p>
                  <p className="text-sm text-content-secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearFile()
                  }}
                  className="text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-forest-green" />
                <div className="text-center">
                  <p className="font-medium text-content-primary">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-sm text-content-secondary">
                    PDF only, max 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`bg-bright-green hover:bg-[#8AD960] text-forest-green ${className}`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </>
        )}
      </Button>
    </>
  )
}
