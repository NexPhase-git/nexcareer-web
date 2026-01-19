'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createNexCareerCore,
  type Profile,
  type Education,
  type Experience,
} from '@nexcareer/core'

function getCore() {
  const supabase = createClient()
  return createNexCareerCore({
    supabaseClient: supabase as never,
    groqApiKey: '',
  })
}

export interface UseProfileOptions {
  userId: string | null
}

export interface UpdateProfileData {
  name?: string | null
  email?: string | null
  phone?: string | null
  summary?: string | null
  skills?: string[]
  education?: Education[]
  experience?: Experience[]
  resumeUrl?: string | null
}

export interface UseProfileReturn {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<Profile>
}

/**
 * Hook for managing user profile
 */
export function useProfile(options: UseProfileOptions): UseProfileReturn {
  const { userId } = options
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const core = getCore()
      const result = await core.useCases.getProfile.execute({ userId })
      setProfile(result.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const updateProfile = useCallback(
    async (data: UpdateProfileData): Promise<Profile> => {
      if (!userId) throw new Error('User not authenticated')

      const core = getCore()
      const result = await core.useCases.updateProfile.execute({
        userId,
        ...data,
      })

      setProfile(result.profile)
      return result.profile
    },
    [userId]
  )

  return {
    profile,
    isLoading,
    error,
    reload: loadProfile,
    updateProfile,
  }
}
