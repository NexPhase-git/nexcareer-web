'use client'

import { Suspense, useState, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  ArrowLeft,
  X,
  Building2,
  Briefcase,
  Tag,
  FileText,
  SearchX,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser, useApplications } from '@/hooks'
import { type Application, type ApplicationStatus } from '@nexcareer/core'

const statusColors: Record<ApplicationStatus, string> = {
  Saved: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  )
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <Input placeholder="Search applications..." disabled />
        </div>
      </header>
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
      </div>
    </div>
  )
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const inputRef = useRef<HTMLInputElement>(null)

  const { user, isLoading: isLoadingUser } = useCurrentUser({ redirectTo: '/login' })
  const { applications, isLoading: isLoadingApps } = useApplications({
    userId: user?.id ?? null,
  })

  const [query, setQuery] = useState(initialQuery)
  const [hasSearched, setHasSearched] = useState(!!initialQuery)

  const isLoading = isLoadingUser || isLoadingApps

  // Perform local search on applications
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase()

    if (!trimmed) {
      return []
    }

    return applications.filter((app) => {
      const company = app.company.toLowerCase()
      const position = app.position.toLowerCase()
      const notes = (app.notes || '').toLowerCase()
      const status = app.status.toLowerCase()

      return (
        company.includes(trimmed) ||
        position.includes(trimmed) ||
        notes.includes(trimmed) ||
        status.includes(trimmed)
      )
    })
  }, [applications, query])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setHasSearched(!!value.trim())
  }

  const clearSearch = () => {
    setQuery('')
    setHasSearched(false)
    inputRef.current?.focus()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Input placeholder="Search applications..." disabled />
          </div>
        </header>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search applications..."
            className="pl-9 pr-9"
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary hover:text-content-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-2xl mx-auto">
          {!hasSearched ? (
            // Initial state - show tips and recent
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-content-primary mb-4">Search Tips</h2>
                <div className="space-y-3">
                  <SearchTip
                    icon={<Building2 className="w-5 h-5" />}
                    title="Company name"
                    example={'"Google", "Microsoft"'}
                  />
                  <SearchTip
                    icon={<Briefcase className="w-5 h-5" />}
                    title="Position"
                    example={'"Software Engineer", "Product Manager"'}
                  />
                  <SearchTip
                    icon={<Tag className="w-5 h-5" />}
                    title="Status"
                    example={'"Applied", "Interview", "Offer"'}
                  />
                  <SearchTip
                    icon={<FileText className="w-5 h-5" />}
                    title="Notes"
                    example="Search within your notes"
                  />
                </div>
              </div>

              {applications.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-content-primary mb-4">Recent Applications</h2>
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <ApplicationItem key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            // No results
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 rounded-full bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] mb-6">
                <SearchX className="w-12 h-12 text-accent-green" />
              </div>
              <h2 className="text-xl font-bold text-content-primary mb-2">No results found</h2>
              <p className="text-content-secondary max-w-sm">
                Try searching for a different company, position, or status
              </p>
            </div>
          ) : (
            // Results
            <div>
              <p className="text-sm text-content-secondary mb-4">
                {results.length} result{results.length === 1 ? '' : 's'} found
              </p>
              <div className="space-y-3">
                {results.map((app) => (
                  <ApplicationItem key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchTip({ icon, title, example }: { icon: React.ReactNode; title: string; example: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-content-secondary">{icon}</div>
          <div>
            <p className="text-sm font-medium text-content-primary">{title}</p>
            <p className="text-sm text-content-secondary">{example}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationItem({ application }: { application: Application }) {
  return (
    <Link href={`/tracker/${application.id}`}>
      <Card className="border-border hover:border-accent-green transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-content-primary truncate">{application.position}</p>
              <p className="text-sm text-content-secondary truncate">{application.company}</p>
              {application.appliedDate && (
                <p className="text-xs text-content-tertiary mt-1">
                  Applied {application.appliedDate.toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge className={statusColors[application.status]}>
              {application.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
