/**
 * Minimal Supabase client interface
 * This allows the core package to work without directly depending on @supabase/supabase-js
 * The actual client is injected from the consuming application
 */
export interface SupabaseClient {
  from(table: string): SupabaseQueryBuilder
  auth: SupabaseAuth
  storage: SupabaseStorage
}

export interface SupabaseQueryBuilder {
  select(columns?: string): SupabaseFilterBuilder
  insert(values: Record<string, unknown> | Record<string, unknown>[]): SupabaseFilterBuilder
  update(values: Record<string, unknown>): SupabaseFilterBuilder
  delete(): SupabaseFilterBuilder
  upsert(values: Record<string, unknown>): SupabaseFilterBuilder
}

export interface SupabaseFilterBuilder {
  eq(column: string, value: unknown): SupabaseFilterBuilder
  neq(column: string, value: unknown): SupabaseFilterBuilder
  in(column: string, values: unknown[]): SupabaseFilterBuilder
  ilike(column: string, pattern: string): SupabaseFilterBuilder
  or(filters: string): SupabaseFilterBuilder
  order(column: string, options?: { ascending?: boolean }): SupabaseFilterBuilder
  limit(count: number): SupabaseFilterBuilder
  single(): SupabaseFilterBuilder
  select(columns?: string): SupabaseFilterBuilder
  then<T>(
    onfulfilled?: (value: SupabaseResponse<T>) => T | PromiseLike<T>
  ): Promise<T>
}

export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
  count?: number
}

export interface SupabaseError {
  message: string
  code?: string
}

export interface SupabaseAuth {
  getUser(): Promise<{ data: { user: SupabaseUser | null }; error: SupabaseError | null }>
  signInWithPassword(credentials: {
    email: string
    password: string
  }): Promise<{ data: { user: SupabaseUser | null }; error: SupabaseError | null }>
  signUp(credentials: {
    email: string
    password: string
  }): Promise<{ data: { user: SupabaseUser | null }; error: SupabaseError | null }>
  signOut(): Promise<{ error: SupabaseError | null }>
  resetPasswordForEmail(email: string): Promise<{ error: SupabaseError | null }>
}

export interface SupabaseUser {
  id: string
  email?: string
  created_at: string
}

export interface SupabaseStorage {
  from(bucket: string): SupabaseStorageBucket
}

export interface SupabaseStorageBucket {
  upload(
    path: string,
    file: File | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ data: { path: string } | null; error: SupabaseError | null }>
  remove(paths: string[]): Promise<{ error: SupabaseError | null }>
  createSignedUrl(
    path: string,
    expiresIn: number
  ): Promise<{ data: { signedUrl: string } | null; error: SupabaseError | null }>
  getPublicUrl(path: string): { data: { publicUrl: string } }
}
