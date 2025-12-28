'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Calendar,
  Gift,
  Bookmark,
  Plus,
  Upload,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, Application, ApplicationStatus } from '@/types/database'

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(22,51,0,0.08)]">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-content-primary">{value}</p>
            <p className="text-sm text-content-secondary">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  isLoading?: boolean
}

function QuickAction({ icon, label, href, onClick, isLoading }: QuickActionProps) {
  const content = (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors cursor-pointer min-w-[100px]">
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-forest-green animate-spin" />
      ) : (
        <div className="text-forest-green">{icon}</div>
      )}
      <span className="text-sm font-medium text-content-primary">{label}</span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return <button onClick={onClick}>{content}</button>
}

const statusColors: Record<ApplicationStatus, string> = {
  saved: 'bg-gray-100 text-gray-700',
  applied: 'bg-blue-100 text-blue-700',
  interview: 'bg-amber-100 text-amber-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<ApplicationStatus, number>>({
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData as UserProfile)
    }

    // Load applications
    const { data: appsData } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (appsData) {
      setApplications(appsData as Application[])

      // Calculate status counts
      const counts: Record<ApplicationStatus, number> = {
        saved: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      }

      appsData.forEach((app) => {
        counts[app.status as ApplicationStatus]++
      })

      setStatusCounts(counts)
    }

    setIsLoading(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Dashboard" userName={profile?.name}>
      <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
        {/* Greeting */}
        <h2 className="text-2xl font-bold text-content-primary">
          {getGreeting()}{profile?.name ? `, ${profile.name}` : ''}!
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText className="w-5 h-5 text-forest-green" />}
            value={String(statusCounts.applied)}
            label="Total Applied"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-forest-green" />}
            value={String(statusCounts.interview)}
            label="Interviews"
          />
          <StatCard
            icon={<Gift className="w-5 h-5 text-forest-green" />}
            value={String(statusCounts.offer)}
            label="Offers"
          />
          <StatCard
            icon={<Bookmark className="w-5 h-5 text-forest-green" />}
            value={String(statusCounts.saved)}
            label="Saved"
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          {/* Profile Card or Upload Prompt */}
          {!profile?.name ? (
            <Card className="border-border">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-[rgba(22,51,0,0.08)] mb-4">
                  <Upload className="w-10 h-10 text-forest-green" />
                </div>
                <h3 className="text-lg font-semibold text-content-primary mb-2">
                  Get Started
                </h3>
                <p className="text-sm text-content-secondary mb-4">
                  Upload your resume to create your profile automatically with AI
                </p>
                <Button className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="p-4">
                <Link href="/profile" className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-bright-green flex items-center justify-center">
                    <span className="text-lg font-bold text-forest-green">
                      {profile.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-content-primary">{profile.name}</p>
                    <p className="text-sm text-content-secondary">
                      {profile.skills?.length || 0} skills
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-base font-semibold text-content-primary mb-3">
              Quick Actions
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <QuickAction
                icon={<Plus className="w-6 h-6" />}
                label="Add App"
                href="/tracker/add"
              />
              <QuickAction
                icon={<Upload className="w-6 h-6" />}
                label="Upload"
                onClick={() => {}}
              />
              <QuickAction
                icon={<MessageSquare className="w-6 h-6" />}
                label="AI"
                href="/assistant"
              />
              <QuickAction
                icon={<GraduationCap className="w-6 h-6" />}
                label="Coach"
                href="/coach"
              />
            </div>
          </div>

          {/* Recent Applications */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-content-primary">
                  Recent Applications
                </h3>
                <Link href="/tracker">
                  <Button variant="ghost" size="sm" className="text-forest-green">
                    View All
                  </Button>
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="py-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-content-tertiary mb-3" />
                  <p className="text-content-secondary mb-4">No applications yet</p>
                  <Link href="/tracker/add">
                    <Button size="sm" className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Application
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/tracker/${app.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-[rgba(22,51,0,0.08)] transition-colors"
                    >
                      <div>
                        <p className="font-medium text-content-primary">{app.role}</p>
                        <p className="text-sm text-content-secondary">{app.company}</p>
                      </div>
                      <Badge className={statusColors[app.status]}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Left Column - Recent Applications */}
          <div className="col-span-3">
            <Card className="border-border h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-content-primary">
                    Recent Applications
                  </h3>
                  <Link href="/tracker">
                    <Button variant="ghost" size="sm" className="text-forest-green">
                      View All
                    </Button>
                  </Link>
                </div>

                {applications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Briefcase className="w-12 h-12 mx-auto text-content-tertiary mb-3" />
                    <p className="text-content-secondary mb-4">No applications yet</p>
                    <Link href="/tracker/add">
                      <Button size="sm" className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Application
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <Link
                        key={app.id}
                        href={`/tracker/${app.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-[rgba(22,51,0,0.08)] transition-colors"
                      >
                        <div>
                          <p className="font-medium text-content-primary">{app.role}</p>
                          <p className="text-sm text-content-secondary">{app.company}</p>
                        </div>
                        <Badge className={statusColors[app.status]}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="col-span-2 space-y-4">
            {/* Profile Card or Upload Prompt */}
            {!profile?.name ? (
              <Card className="border-border">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-[rgba(22,51,0,0.08)] mb-4">
                    <Upload className="w-10 h-10 text-forest-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-content-primary mb-2">
                    Get Started
                  </h3>
                  <p className="text-sm text-content-secondary mb-4">
                    Upload your resume to create your profile automatically with AI
                  </p>
                  <Button className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardContent className="p-4">
                  <Link href="/profile" className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-bright-green flex items-center justify-center">
                      <span className="text-xl font-bold text-forest-green">
                        {profile.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-content-primary">{profile.name}</p>
                      <p className="text-sm text-content-secondary">
                        {profile.skills?.length || 0} skills &bull; {profile.experience?.length || 0} experiences
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-border">
              <CardContent className="p-4 space-y-2">
                <Link
                  href="/tracker/add"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Plus className="w-5 h-5 text-forest-green" />
                  <span className="text-sm font-medium text-content-primary">
                    Add Application
                  </span>
                </Link>
                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors w-full">
                  <Upload className="w-5 h-5 text-forest-green" />
                  <span className="text-sm font-medium text-content-primary">
                    Upload Resume
                  </span>
                </button>
                <Link
                  href="/assistant"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-forest-green" />
                  <span className="text-sm font-medium text-content-primary">
                    AI Assistant
                  </span>
                </Link>
                <Link
                  href="/coach"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <GraduationCap className="w-5 h-5 text-forest-green" />
                  <span className="text-sm font-medium text-content-primary">
                    Interview Coach
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
