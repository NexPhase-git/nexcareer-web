'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created! Please check your email to verify.')
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background">
        <div className="px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-content-primary hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex justify-center px-6">
        <div className="w-full max-w-[400px]">
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Header Text */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-content-primary">
                Create Account
              </h1>
              <p className="text-sm text-content-secondary">
                Start your career journey with NexCareer
              </p>
            </div>

            <div className="h-4" />

            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-content-primary">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background border-border focus:border-forest-green focus:ring-forest-green"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-content-primary">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-background border-border focus:border-forest-green focus:ring-forest-green"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary hover:text-content-primary"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-content-primary">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-background border-border focus:border-forest-green focus:ring-forest-green"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary hover:text-content-primary"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="h-4" />

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium bg-bright-green hover:bg-[#8AD960] text-forest-green"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>

            <div className="h-2" />

            {/* Login link */}
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm text-content-secondary">
                Already have an account?
              </span>
              <Link
                href="/login"
                className="text-sm font-semibold text-forest-green hover:underline"
              >
                Log In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
