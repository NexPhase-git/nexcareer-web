/**
 * AuthService interface (port)
 * Defines the contract for authentication operations
 */
export interface AuthService {
  /**
   * Get the current authenticated user
   */
  getCurrentUser(): Promise<AuthUser | null>

  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<AuthResponse>

  /**
   * Sign up with email and password
   */
  signUp(email: string, password: string): Promise<AuthResponse>

  /**
   * Sign out the current user
   */
  signOut(): Promise<void>

  /**
   * Send password reset email
   */
  resetPassword(email: string): Promise<AuthResponse>
}

export interface AuthUser {
  id: string
  email: string | null
  createdAt: Date
}

export interface AuthResponse {
  user?: AuthUser
  error?: string
}
