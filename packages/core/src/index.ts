/**
 * @nexcareer/core
 *
 * Shared business logic and domain entities for NexCareer applications.
 * This package is platform-agnostic and can be used by:
 * - Next.js web application
 * - React Native mobile application
 * - Any other JavaScript/TypeScript runtime
 */

// Domain Layer - Entities and Value Objects
export * from './domain'

// Application Layer - Use Cases and Ports (Interfaces)
export * from './application'

// Infrastructure Layer - Implementations (Supabase, Groq, etc.)
export * from './infrastructure'

// Factory - Easy instantiation with dependency injection
export * from './factory'
