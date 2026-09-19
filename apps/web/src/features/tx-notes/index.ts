/**
 * TxNotes Feature - Public API
 *
 * This feature provides transaction notes functionality.
 */

import { createFeatureHandle } from '@/features/__core__'
import type { TxNotesContract } from './contract'

export const TxNotesFeature = createFeatureHandle<TxNotesContract>('tx-notes')

export type { TxNotesContract } from './contract'
