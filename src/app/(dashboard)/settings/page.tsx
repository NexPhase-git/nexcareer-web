'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  User,
  Lock,
  Download,
  Trash2,
  FileX,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserProfile, Application } from '@/types/database'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [applicationCount, setApplicationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [showEditNameDialog, setShowEditNameDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showClearAppsDialog, setShowClearAppsDialog] = useState(false)
  const [showDeleteResumeDialog, setShowDeleteResumeDialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)

  // Form states
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

    setUserEmail(user.email || null)

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData as UserProfile)
      setNewName(profileData.name || '')
    }

    // Load application count
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setApplicationCount(count || 0)
    setIsLoading(false)
  }

  // ============================================
  // ACCOUNT ACTIONS
  // ============================================

  const handleEditName = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a name')
      return
    }

    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: newName.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setIsSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setProfile(prev => prev ? { ...prev, name: newName.trim() } : null)
    setShowEditNameDialog(false)
    toast.success('Name updated successfully')
  }

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setShowChangePasswordDialog(false)
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password changed successfully')
  }

  // ============================================
  // DATA & PRIVACY ACTIONS
  // ============================================

  const handleExportData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in')
      return
    }

    try {
      // Fetch all data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: appsData } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Build CSV
      let csv = 'PROFILE\n'
      csv += 'Name,Email,Phone,Skills\n'
      csv += `"${profileData?.name || ''}","${profileData?.email || ''}","${profileData?.phone || ''}","${(profileData?.skills || []).join(', ')}"\n\n`

      csv += 'APPLICATIONS\n'
      csv += 'Company,Position,Status,Applied Date,Notes,URL\n'

      for (const app of (appsData || []) as Application[]) {
        csv += `"${app.company}","${app.position}","${app.status}","${app.applied_date || ''}","${app.notes || ''}","${app.url || ''}"\n`
      }

      // Download file
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexcareer_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch {
      toast.error('Failed to export data')
    }
  }

  const handleClearApplications = async () => {
    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in')
      return
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('user_id', user.id)

    setIsSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setApplicationCount(0)
    setShowClearAppsDialog(false)
    toast.success('All applications cleared')
  }

  const handleDeleteResume = async () => {
    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please log in')
      return
    }

    // Delete from storage if exists
    if (profile?.resume_url) {
      const fileName = profile.resume_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('resumes')
          .remove([`${user.id}/${fileName}`])
      }
    }

    // Clear profile data (keep name and email)
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: null,
        summary: null,
        skills: [],
        education: [],
        experience: [],
        resume_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    setIsSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setProfile(prev => prev ? {
      ...prev,
      phone: null,
      summary: null,
      skills: [],
      education: [],
      experience: [],
      resume_url: null,
    } : null)
    setShowDeleteResumeDialog(false)
    toast.success('Resume and parsed data deleted')
  }

  // ============================================
  // DANGER ZONE
  // ============================================

  const handleDeleteAccount = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      // Delete user's data first
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Delete applications
        await supabase.from('applications').delete().eq('user_id', user.id)
        // Delete profile
        await supabase.from('profiles').delete().eq('user_id', user.id)
        // Delete from storage
        const { data: files } = await supabase.storage.from('resumes').list(user.id)
        if (files && files.length > 0) {
          await supabase.storage.from('resumes').remove(files.map(f => `${user.id}/${f.name}`))
        }
      }

      // Sign out (Note: actual account deletion requires admin API or edge function)
      await supabase.auth.signOut()

      toast.success('Account deleted')
      router.push('/')
    } catch {
      toast.error('Failed to delete account')
    }

    setIsSaving(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <AppShell title="Settings">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Settings">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-[600px] mx-auto space-y-6">
          {/* Account Card */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-4">
                Account
              </h3>
              <div className="divide-y divide-border">
                {/* Name */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Name</p>
                    <p className="text-sm text-content-secondary">{profile?.name || 'Not set'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditNameDialog(true)}
                  >
                    Edit
                  </Button>
                </div>

                {/* Email */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Email</p>
                    <p className="text-sm text-content-secondary">{userEmail || 'Not set'}</p>
                  </div>
                </div>

                {/* Password */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Password</p>
                    <p className="text-sm text-content-secondary">••••••••</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePasswordDialog(true)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy Card */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-4">
                Data & Privacy
              </h3>
              <div className="divide-y divide-border">
                {/* Export Data */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Export Data</p>
                    <p className="text-sm text-content-secondary">Download all your data as CSV</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Clear Applications */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Clear Applications</p>
                    <p className="text-sm text-content-secondary">Remove all job applications</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearAppsDialog(true)}
                    disabled={applicationCount === 0}
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Delete Resume */}
                <div className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Delete Resume</p>
                    <p className="text-sm text-content-secondary">Remove your uploaded resume and parsed data</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteResumeDialog(true)}
                    disabled={!profile?.resume_url}
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Card */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-4">
                About
              </h3>
              <div className="divide-y divide-border">
                {/* Version */}
                <div className="py-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-content-primary">Version</p>
                  <p className="text-sm text-content-secondary">1.0.0-beta</p>
                </div>

                {/* Powered by */}
                <div className="py-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-content-primary">Powered by</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-bright-green flex items-center justify-center">
                      <span className="text-xs font-bold text-forest-green">N</span>
                    </div>
                    <span className="text-sm font-semibold text-content-primary">NexPhase</span>
                  </div>
                </div>

                {/* Links */}
                <Link
                  href="https://nexphase.dev/privacy"
                  target="_blank"
                  className="py-4 flex items-center justify-between hover:bg-muted -mx-6 px-6"
                >
                  <p className="text-sm font-medium text-content-primary">Privacy Policy</p>
                  <ExternalLink className="w-4 h-4 text-content-tertiary" />
                </Link>

                <Link
                  href="https://nexphase.dev/terms"
                  target="_blank"
                  className="py-4 flex items-center justify-between hover:bg-muted -mx-6 px-6"
                >
                  <p className="text-sm font-medium text-content-primary">Terms of Service</p>
                  <ExternalLink className="w-4 h-4 text-content-tertiary" />
                </Link>

                <Link
                  href="mailto:feedback@nexphase.dev"
                  className="py-4 flex items-center justify-between hover:bg-muted -mx-6 px-6"
                >
                  <p className="text-sm font-medium text-content-primary">Send Feedback</p>
                  <ExternalLink className="w-4 h-4 text-content-tertiary" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive/30">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide mb-4">
                Danger Zone
              </h3>
              <div className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-content-primary">Delete Account</p>
                  <p className="text-sm text-content-secondary">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteAccountDialog(true)}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditNameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditName}
              disabled={isSaving}
              className="bg-bright-green hover:bg-[#8AD960] text-forest-green"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isSaving}
              className="bg-bright-green hover:bg-[#8AD960] text-forest-green"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Applications Dialog */}
      <Dialog open={showClearAppsDialog} onOpenChange={setShowClearAppsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Applications?</DialogTitle>
            <DialogDescription>
              This will delete all {applicationCount} applications. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearAppsDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearApplications}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clear All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resume Dialog */}
      <Dialog open={showDeleteResumeDialog} onOpenChange={setShowDeleteResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume?</DialogTitle>
            <DialogDescription>
              This will delete your resume file and all parsed profile data (skills, education, experience). Your name and email will be kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteResumeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteResume}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account, profile, and all applications. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAccountDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
