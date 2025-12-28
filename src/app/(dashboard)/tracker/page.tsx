'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Loader2, Search } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Application, ApplicationStatus } from '@/types/database'

const statusColors: Record<ApplicationStatus, string> = {
  Saved: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  Applied: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
  Interview: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50',
  Offer: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
  Rejected: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
}

type FilterStatus = ApplicationStatus | 'all'

export default function TrackerPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setApplications(data as Application[])
    }

    setIsLoading(false)
  }

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter((app) => app.status === filter)

  const getStatusCount = (status: ApplicationStatus | 'all') => {
    if (status === 'all') return applications.length
    return applications.filter((app) => app.status === status).length
  }

  const allStatuses: ApplicationStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

  if (isLoading) {
    return (
      <AppShell title="Applications">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
        </div>
      </AppShell>
    )
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <AppShell title="Applications">
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <div className="p-6 rounded-full bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.12)] mb-6">
            <Briefcase className="w-16 h-16 text-accent-green" />
          </div>
          <h2 className="text-xl font-bold text-content-primary mb-2">
            No Applications Yet
          </h2>
          <p className="text-content-secondary mb-6">
            Start tracking your job applications to stay organized
          </p>
          <Link href="/tracker/add">
            <Button className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Application
            </Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Applications">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-content-primary">Applications</h2>
            <p className="text-sm text-content-secondary">
              {applications.length} total applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search">
              <Button variant="outline" size="icon" className="border-border">
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/tracker/add">
              <Button className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Application</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.15)] text-accent-green border border-current'
                : 'bg-card text-content-secondary border border-border hover:bg-muted'
            }`}
          >
            All ({getStatusCount('all')})
          </button>
          {allStatuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-[rgba(22,51,0,0.08)] dark:bg-[rgba(159,232,112,0.15)] text-accent-green border border-current'
                  : 'bg-card text-content-secondary border border-border hover:bg-muted'
              }`}
            >
              {status} ({getStatusCount(status)})
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="w-12 h-12 text-content-tertiary mb-3" />
            <p className="text-content-secondary">
              No {filter !== 'all' && filter} applications
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <Link key={app.id} href={`/tracker/${app.id}`} className="block">
                <Card className="border-border hover:border-forest-green transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-content-primary truncate">
                          {app.position}
                        </p>
                        <p className="text-sm text-content-secondary truncate">
                          {app.company}
                        </p>
                        {app.applied_date && (
                          <p className="text-xs text-content-tertiary mt-1">
                            Applied {new Date(app.applied_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className={statusColors[app.status]}>
                        {app.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
