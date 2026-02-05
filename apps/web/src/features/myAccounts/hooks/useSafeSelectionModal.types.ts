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

/** State management for the safe selection modal */
export interface SafeSelectionModalState {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** List of safes available for selection */
  availableSafes: SelectableSafe[]
  /** Set of currently selected addresses */
  selectedAddresses: Set<string>
  /** Address awaiting similarity confirmation (null if none) */
  pendingConfirmation: string | null
  /** Current search query */
  searchQuery: string
  /** Whether safes are loading */
  isLoading: boolean

  // Actions
  /** Open the modal */
  open: () => void
  /** Close the modal */
  close: () => void
  /** Toggle selection for an address */
  toggleSelection: (address: string) => void
  /** Confirm selection of a similar address */
  confirmSimilarAddress: (address: string) => void
  /** Cancel selection of a similar address */
  cancelSimilarAddress: () => void
  /** Submit the current selection */
  submitSelection: () => void
  /** Update search query */
  setSearchQuery: (query: string) => void
}
