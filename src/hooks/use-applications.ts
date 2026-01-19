'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createNexCareerCore,
  type Application,
  type ApplicationStatus,
  type ApplicationStats,
} from '@nexcareer/core'

// Create core instance for client-side usage
function getCore() {
  const supabase = createClient()
  return createNexCareerCore({
    supabaseClient: supabase as never, // Type assertion needed for Supabase client compatibility
    groqApiKey: '', // Not needed for client-side application operations
  })
}

export interface UseApplicationsOptions {
  userId: string | null
  status?: ApplicationStatus
  autoLoad?: boolean
}

export interface UseApplicationsReturn {
  applications: Application[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createApplication: (data: CreateApplicationData) => Promise<Application>
  updateApplication: (id: string, data: UpdateApplicationData) => Promise<Application>
  deleteApplication: (id: string) => Promise<void>
}

export interface CreateApplicationData {
  company: string
  position: string
  status?: ApplicationStatus
  appliedDate?: Date | null
  notes?: string | null
  url?: string | null
}

export interface UpdateApplicationData {
  company?: string
  position?: string
  status?: ApplicationStatus
  appliedDate?: Date | null
  notes?: string | null
  url?: string | null
}

/**
 * Hook for managing applications using the clean architecture
 */
export function useApplications(options: UseApplicationsOptions): UseApplicationsReturn {
  const { userId, status, autoLoad = true } = options
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    if (!userId) {
      setApplications([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const core = getCore()
      const result = await core.useCases.getApplications.execute({
        userId,
        status,
      })
      setApplications(result.applications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }, [userId, status])

  useEffect(() => {
    if (autoLoad) {
      loadApplications()
    }
  }, [loadApplications, autoLoad])

  const createApplication = useCallback(
    async (data: CreateApplicationData): Promise<Application> => {
      if (!userId) throw new Error('User not authenticated')

      const core = getCore()
      const result = await core.useCases.createApplication.execute({
        userId,
        ...data,
      })

      // Reload to get updated list
      await loadApplications()

      return result.application
    },
    [userId, loadApplications]
  )

  const updateApplication = useCallback(
    async (id: string, data: UpdateApplicationData): Promise<Application> => {
      if (!userId) throw new Error('User not authenticated')

      const core = getCore()
      const result = await core.useCases.updateApplication.execute({
        id,
        userId,
        ...data,
      })

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? result.application : app))
      )

      return result.application
    },
    [userId]
  )

  const deleteApplication = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated')

      const core = getCore()
      await core.useCases.deleteApplication.execute({ id, userId })

      // Remove from local state
      setApplications((prev) => prev.filter((app) => app.id !== id))
    },
    [userId]
  )

  return {
    applications,
    isLoading,
    error,
    reload: loadApplications,
    createApplication,
    updateApplication,
    deleteApplication,
  }
}

/**
 * Hook for application statistics
 */
export function useApplicationStats(userId: string | null) {
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      if (!userId) {
        setStats(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const core = getCore()
        const result = await core.useCases.getApplicationStats.execute({ userId })
        setStats(result.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [userId])

  return { stats, isLoading, error }
}

/**
 * Hook for fetching a single application by ID
 */
export function useApplication(applicationId: string | null, userId: string | null) {
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const reload = useCallback(async () => {
    if (!applicationId) {
      setApplication(null)
      setIsLoading(false)
      setHasFetched(true)
      return
    }

    // Wait for userId before attempting to fetch
    if (!userId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const core = getCore()
      const result = await core.useCases.getApplicationById.execute({
        id: applicationId,
        userId,
      })
      setApplication(result.application)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
      setApplication(null)
    } finally {
      setIsLoading(false)
      setHasFetched(true)
    }
  }, [applicationId, userId])

  useEffect(() => {
    reload()
  }, [reload])

  // Only report not loading once we've actually attempted a fetch with valid userId
  const effectiveIsLoading = !hasFetched || isLoading

  return { application, isLoading: effectiveIsLoading, error, reload }
}

/**
 * Hook for searching applications
 */
export function useApplicationSearch(userId: string | null) {
  const [results, setResults] = useState<Application[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const search = useCallback(
    async (keyword: string) => {
      if (!userId || !keyword.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const core = getCore()
        const result = await core.useCases.searchApplications.execute({
          userId,
          keyword,
        })
        setResults(result.applications)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [userId]
  )

  const clearSearch = useCallback(() => {
    setResults([])
  }, [])

  return { results, isSearching, search, clearSearch }
}
