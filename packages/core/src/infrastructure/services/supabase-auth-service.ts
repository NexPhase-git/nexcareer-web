import type { AuthService, AuthUser, AuthResponse } from '../..'
import type { SupabaseClient } from '..'

/**
 * Supabase implementation of AuthService
 */
export class SupabaseAuthService implements AuthService {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.client.auth.getUser()

      if (error || !data.user) {
        return null
      }

      return {
        id: data.user.id,
        email: data.user.email ?? null,
        createdAt: new Date(data.user.created_at),
      }
    } catch {
      return null
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (!data.user) {
        return { error: 'Sign in failed' }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          createdAt: new Date(data.user.created_at),
        },
      }
    } catch (error) {
      return { error: `Sign in failed: ${error}` }
    }
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (!data.user) {
        return { error: 'Sign up failed' }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          createdAt: new Date(data.user.created_at),
        },
      }
    } catch (error) {
      return { error: `Sign up failed: ${error}` }
    }
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut()
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email)

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: `Password reset failed: ${error}` }
    }
  }
}
