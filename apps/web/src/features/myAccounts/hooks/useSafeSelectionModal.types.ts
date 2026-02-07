/**
 * Type definitions for safe selection modal
 *
 * Used by the SafeSelectionModal component for selecting safes to pin.
 */

import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'

/** A safe item with selection state for the modal - extends SafeItem with selection and similarity data */
export interface SelectableSafe extends SafeItem {
  /** Whether this safe is currently selected in modal */
  isSelected: boolean
  /** Bucket key if flagged for similarity */
  similarityGroup?: string
}

/** A multichain safe item with selection state for the modal */
export interface SelectableMultiChainSafe extends Omit<MultiChainSafeItem, 'safes'> {
  /** Child safes with selection state */
  safes: SelectableSafe[]
  /** Whether all safes in this group are selected */
  isSelected: boolean
  /** Whether some but not all safes are selected (indeterminate) */
  isPartiallySelected: boolean
  /** Bucket key if flagged for similarity */
  similarityGroup?: string
}

/** Union type for all selectable items */
export type SelectableItem = SelectableSafe | SelectableMultiChainSafe

/** Type guard to check if an item is a multichain safe */
export const isSelectableMultiChainSafe = (item: SelectableItem): item is SelectableMultiChainSafe => {
  return 'safes' in item && Array.isArray(item.safes)
}
