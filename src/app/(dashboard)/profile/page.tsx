'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Mail,
  Phone,
  FileText,
  Lightbulb,
  Briefcase,
  GraduationCap,
  Edit,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/database'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setProfile(data as UserProfile)
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <AppShell title="Profile">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
        </div>
      </AppShell>
    )
  }

  // Empty state
  if (!profile || !profile.name) {
    return (
      <AppShell title="Profile">
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <div className="p-6 rounded-full bg-[rgba(22,51,0,0.08)] mb-6">
            <Upload className="w-16 h-16 text-forest-green" />
          </div>
          <h2 className="text-xl font-bold text-content-primary mb-2">
            No Profile Yet
          </h2>
          <p className="text-content-secondary mb-6 max-w-sm">
            Upload your resume to automatically create your profile with AI
          </p>
          <Button className="bg-bright-green hover:bg-[#8AD960] text-forest-green">
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="My Profile"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="border-forest-green text-forest-green hover:bg-[rgba(22,51,0,0.08)]"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      }
    >
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-bright-green flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-forest-green">
                    {profile.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-content-primary truncate">
                    {profile.name}
                  </h2>
                  <p className="text-sm text-content-secondary">
                    {profile.skills?.length || 0} skills &bull; {profile.experience?.length || 0} experiences
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-content-secondary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Update Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-forest-green text-forest-green"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(profile.email || profile.phone) && (
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-forest-green" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Contact Information
                  </h3>
                </div>
                <div className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-content-secondary" />
                      <span className="text-sm text-content-secondary">Email:</span>
                      <span className="text-sm text-content-primary">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-content-secondary" />
                      <span className="text-sm text-content-secondary">Phone:</span>
                      <span className="text-sm text-content-primary">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Summary */}
          {profile.summary && (
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-forest-green" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Professional Summary
                  </h3>
                </div>
                <p className="text-sm text-content-primary leading-relaxed">
                  {profile.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-forest-green" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Skills
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className="bg-[rgba(22,51,0,0.08)] text-forest-green hover:bg-[rgba(22,51,0,0.12)]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Experience */}
          {profile.experience && profile.experience.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-forest-green" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Work Experience
                  </h3>
                </div>
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-muted"
                    >
                      <h4 className="font-semibold text-content-primary">
                        {exp.role}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Briefcase className="w-3.5 h-3.5 text-forest-green" />
                        <span className="text-sm text-forest-green">
                          {exp.company}
                        </span>
                      </div>
                      {exp.duration && (
                        <p className="text-xs text-content-tertiary mt-1">
                          {exp.duration}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-sm text-content-secondary mt-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {profile.education && profile.education.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-forest-green" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Education
                  </h3>
                </div>
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-muted"
                    >
                      <h4 className="font-semibold text-content-primary">
                        {edu.degree}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <GraduationCap className="w-3.5 h-3.5 text-forest-green" />
                        <span className="text-sm text-forest-green">
                          {edu.school}
                        </span>
                      </div>
                      {edu.year && (
                        <p className="text-xs text-content-tertiary mt-1">
                          {edu.year}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
