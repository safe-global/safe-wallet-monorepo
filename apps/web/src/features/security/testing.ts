/**
 * Security Feature - Testing Helpers
 *
 * Dedicated subpath for test-only exports. Consumer test files should import
 * helpers from here rather than reaching into internal paths.
 *
 * ```typescript
 * import { createMockContext } from '@/features/security/testing'
 * ```
 */

export { createMockContext } from './data/scanners/test-helpers'
