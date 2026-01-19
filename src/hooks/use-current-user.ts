'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  id: string
  email: string | null
}

export interface UseCurrentUserOptions {
  redirectTo?: string
  redirectIfFound?: boolean
}

/**
 * Hook for getting the current authenticated user
 */
export function useCurrentUser(options: UseCurrentUserOptions = {}) {
  const { redirectTo, redirectIfFound = false } = options
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? null,
        })

        if (redirectTo && redirectIfFound) {
          router.push(redirectTo)
        }
      } else {
        setUser(null)

        if (redirectTo && !redirectIfFound) {
          router.push(redirectTo)
        }
      }

      setIsLoading(false)
    }

    loadUser()
  }, [router, redirectTo, redirectIfFound])

  return { user, isLoading }
}
