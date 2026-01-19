import type { Repositories } from '.'
import type { Services } from '.'

import {
  // Application use cases
  GetApplications,
  GetApplicationById,
  CreateApplication,
  UpdateApplication,
  DeleteApplication,
  GetApplicationStats,
  SearchApplications,
  ImportApplications,
  // Profile use cases
  GetProfile,
  UpdateProfile,
  ParseResume,
  // Assistant use cases
  SendChatMessage,
  GetSuggestedPrompts,
  // Coach use cases
  StartPracticeSession,
  SubmitAnswer,
  GetPracticeSessions,
  // Types
  type PDFParserService,
} from '..'

export interface UseCases {
  // Applications
  getApplications: GetApplications
  getApplicationById: GetApplicationById
  createApplication: CreateApplication
  updateApplication: UpdateApplication
  deleteApplication: DeleteApplication
  getApplicationStats: GetApplicationStats
  searchApplications: SearchApplications
  importApplications: ImportApplications

  // Profile
  getProfile: GetProfile
  updateProfile: UpdateProfile
  parseResume?: ParseResume // Optional - requires PDF parser

  // Assistant
  sendChatMessage: SendChatMessage
  getSuggestedPrompts: GetSuggestedPrompts

  // Coach
  startPracticeSession: StartPracticeSession
  submitAnswer: SubmitAnswer
  getPracticeSessions: GetPracticeSessions
}

export interface CreateUseCasesOptions {
  repositories: Repositories
  services: Services
  pdfParser?: PDFParserService
}

/**
 * Create all use case instances with their dependencies
 */
export function createUseCases(options: CreateUseCasesOptions): UseCases {
  const { repositories, services, pdfParser } = options

  return {
    // Applications
    getApplications: new GetApplications(repositories.application),
    getApplicationById: new GetApplicationById(repositories.application),
    createApplication: new CreateApplication(repositories.application),
    updateApplication: new UpdateApplication(repositories.application),
    deleteApplication: new DeleteApplication(repositories.application),
    getApplicationStats: new GetApplicationStats(repositories.application),
    searchApplications: new SearchApplications(repositories.application),
    importApplications: new ImportApplications(repositories.application),

    // Profile
    getProfile: new GetProfile(repositories.profile),
    updateProfile: new UpdateProfile(repositories.profile),
    parseResume: pdfParser
      ? new ParseResume(
          repositories.profile,
          services.ai,
          services.storage,
          pdfParser
        )
      : undefined,

    // Assistant
    sendChatMessage: new SendChatMessage(
      services.ai,
      repositories.profile,
      repositories.application
    ),
    getSuggestedPrompts: new GetSuggestedPrompts(repositories.application),

    // Coach
    startPracticeSession: new StartPracticeSession(
      repositories.practiceSession,
      repositories.application,
      repositories.profile,
      services.ai
    ),
    submitAnswer: new SubmitAnswer(
      repositories.practiceSession,
      services.ai
    ),
    getPracticeSessions: new GetPracticeSessions(repositories.practiceSession),
  }
}
