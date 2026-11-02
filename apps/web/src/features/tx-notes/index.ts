import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { TxNotesContract } from './contract'

// Feature handle - uses semantic mapping
export const TxNotesFeature = createFeatureHandle<TxNotesContract>('tx-notes')
