import type { SupabaseClient } from '..'
import {
  GroqAIService,
  SupabaseStorageService,
  SupabaseAuthService,
} from '..'
import type {
  AIService,
  StorageService,
  AuthService,
  PDFParserService,
} from '..'

export interface ServicesConfig {
  groqApiKey: string
  groqModel?: string
}

export interface Services {
  ai: AIService
  storage: StorageService
  auth: AuthService
  // PDF parser is optional and platform-specific
  pdfParser?: PDFParserService
}

/**
 * Create all service instances
 */
export function createServices(
  client: SupabaseClient,
  config: ServicesConfig
): Services {
  return {
    ai: new GroqAIService({
      apiKey: config.groqApiKey,
      model: config.groqModel,
    }),
    storage: new SupabaseStorageService(client),
    auth: new SupabaseAuthService(client),
  }
}
