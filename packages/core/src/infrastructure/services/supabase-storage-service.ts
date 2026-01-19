import type {
  StorageService,
  StorageResponse,
  UploadParams,
} from '../..'
import type { SupabaseClient } from '..'

/**
 * Supabase implementation of StorageService
 */
export class SupabaseStorageService implements StorageService {
  constructor(private readonly client: SupabaseClient) {}

  async upload(params: UploadParams): Promise<StorageResponse<string>> {
    try {
      const { bucket, path, file, contentType, upsert = false } = params

      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert,
        })

      if (error || !data) {
        return { error: error?.message ?? 'Upload failed' }
      }

      // Get public URL for the uploaded file
      const { data: urlData } = this.client.storage.from(bucket).getPublicUrl(data.path)

      return { data: urlData.publicUrl }
    } catch (error) {
      return { error: `Upload failed: ${error}` }
    }
  }

  async delete(path: string): Promise<StorageResponse<void>> {
    try {
      // Extract bucket and file path from full path
      const parts = path.split('/')
      const bucket = parts[0]
      const filePath = parts.slice(1).join('/')

      const { error } = await this.client.storage.from(bucket).remove([filePath])

      if (error) {
        return { error: error.message }
      }

      return { data: undefined }
    } catch (error) {
      return { error: `Delete failed: ${error}` }
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<StorageResponse<string>> {
    try {
      // Extract bucket and file path from full path
      const parts = path.split('/')
      const bucket = parts[0]
      const filePath = parts.slice(1).join('/')

      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)

      if (error || !data) {
        return { error: error?.message ?? 'Failed to create signed URL' }
      }

      return { data: data.signedUrl }
    } catch (error) {
      return { error: `Failed to create signed URL: ${error}` }
    }
  }
}
