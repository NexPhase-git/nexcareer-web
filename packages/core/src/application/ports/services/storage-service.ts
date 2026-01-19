/**
 * StorageService interface (port)
 * Defines the contract for file storage operations
 */
export interface StorageService {
  /**
   * Upload a file and return its URL
   */
  upload(params: UploadParams): Promise<StorageResponse<string>>

  /**
   * Delete a file by its path or URL
   */
  delete(path: string): Promise<StorageResponse<void>>

  /**
   * Get a signed URL for private file access
   */
  getSignedUrl(path: string, expiresIn?: number): Promise<StorageResponse<string>>
}

export interface UploadParams {
  bucket: string
  path: string
  file: File | Blob
  contentType?: string
  upsert?: boolean
}

export interface StorageResponse<T> {
  data?: T
  error?: string
}
