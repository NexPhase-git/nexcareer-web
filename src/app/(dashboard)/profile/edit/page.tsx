'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  X,
  Plus,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserProfile, Education, Experience } from '@/types/database'

export default function EditProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [education, setEducation] = useState<Education[]>([])
  const [experience, setExperience] = useState<Experience[]>([])

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
      const profile = data as UserProfile
      setName(profile.name || '')
      setEmail(profile.email || '')
      setPhone(profile.phone || '')
      setSummary(profile.summary || '')
      setSkills(profile.skills || [])
      setEducation(profile.education || [])
      setExperience(profile.experience || [])
    }

    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in to save profile')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: name.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        summary: summary.trim() || null,
        skills,
        education,
        experience,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setIsSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Profile saved successfully!')
    router.push('/profile')
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const addEducation = () => {
    setEducation([...education, { school: '', degree: '', year: null }])
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value || null }
    setEducation(updated)
  }

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const addExperience = () => {
    setExperience([...experience, { company: '', role: '', duration: null, description: null }])
  }

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experience]
    updated[index] = { ...updated[index], [field]: value || null }
    setExperience(updated)
  }

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <AppShell title="Edit Profile">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Edit Profile">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-content-primary">Basic Information</h2>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Professional Summary</Label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief description of your professional background..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-content-primary placeholder:text-content-tertiary focus:border-forest-green focus:ring-1 focus:ring-forest-green resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-content-primary">Skills</h2>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className="bg-[rgba(22,51,0,0.08)] text-accent-green hover:bg-[rgba(22,51,0,0.12)] dark:bg-[rgba(159,232,112,0.12)] dark:hover:bg-[rgba(159,232,112,0.18)] cursor-pointer"
                      onClick={() => removeSkill(index)}
                    >
                      {skill}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    className="h-10"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    variant="outline"
                    className="border-accent-green text-accent-green"
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-content-primary">Work Experience</h2>
                  <Button
                    type="button"
                    onClick={addExperience}
                    variant="ghost"
                    size="sm"
                    className="text-accent-green"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {experience.map((exp, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-content-secondary">Experience {index + 1}</span>
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-content-secondary hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      value={exp.company || ''}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Company name"
                    />
                    <Input
                      value={exp.role || ''}
                      onChange={(e) => updateExperience(index, 'role', e.target.value)}
                      placeholder="Job title"
                    />
                    <Input
                      value={exp.duration || ''}
                      onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                      placeholder="Duration (e.g., Jan 2020 - Present)"
                    />
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Brief description of responsibilities"
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
                    />
                  </div>
                ))}

                {experience.length === 0 && (
                  <p className="text-sm text-content-secondary text-center py-4">
                    No experience added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-content-primary">Education</h2>
                  <Button
                    type="button"
                    onClick={addEducation}
                    variant="ghost"
                    size="sm"
                    className="text-accent-green"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {education.map((edu, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-content-secondary">Education {index + 1}</span>
                      <button
                        onClick={() => removeEducation(index)}
                        className="text-content-secondary hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      value={edu.school || ''}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      placeholder="School name"
                    />
                    <Input
                      value={edu.degree || ''}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="Degree"
                    />
                    <Input
                      value={edu.year || ''}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      placeholder="Year (e.g., 2020)"
                    />
                  </div>
                ))}

                {education.length === 0 && (
                  <p className="text-sm text-content-secondary text-center py-4">
                    No education added yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 bg-bright-green hover:bg-[#8AD960] text-forest-green"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
