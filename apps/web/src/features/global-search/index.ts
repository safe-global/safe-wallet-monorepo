/**
 * GlobalSearch Feature - Public API
 *
 * This feature provides global search functionality across spaces.
 */

import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { GlobalSearchContract } from './contract'

// Feature handle - uses SPACES flag since global search is part of the spaces experience
export const GlobalSearchFeature = createFeatureHandle<GlobalSearchContract>('global-search', FEATURES.SPACES)

// Contract type (for type annotations if needed)
export type { GlobalSearchContract } from './contract'
