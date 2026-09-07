/**
 * TxNotes Feature - Public API
 *
 * This feature provides transaction notes functionality.
 */

import { createFeatureHandle } from '@/features/__core__'
import type { TxNotesContract } from './contract'

// Feature handle - uses semantic mapping
export const TxNotesFeature = createFeatureHandle<TxNotesContract>('tx-notes')

// Contract type (for type annotations if needed)
export type { TxNotesContract } from './contract'
