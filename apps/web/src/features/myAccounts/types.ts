/**
 * MyAccounts Feature - Public Type Exports
 *
 * Consolidates all public types for the myAccounts feature.
 * Internal types should remain in their respective files.
 */

// Similarity detection types
export type { SimilarityConfig, SimilarityGroup, SimilarityDetectionResult } from './services/addressSimilarity.types'
export { DEFAULT_SIMILARITY_CONFIG } from './services/addressSimilarity.types'

// Safe selection modal types
export type { SelectableSafe } from './hooks/useSafeSelectionModal.types'

// Non-pinned warning types
export type { SafeUserRole, NonPinnedWarningState } from './hooks/useNonPinnedSafeWarning.types'
