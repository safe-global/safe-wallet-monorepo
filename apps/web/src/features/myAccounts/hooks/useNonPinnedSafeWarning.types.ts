/**
 * Type definitions for non-pinned safe warning
 *
 * Used by components that display warnings when a user is viewing
 * a safe they own but haven't pinned.
 */

/** Role of the current user in relation to the safe */
export type SafeUserRole = 'owner' | 'proposer' | 'viewer'

/** Info about a similar address */
export interface SimilarAddressInfo {
  address: string
  name?: string
}

/** Warning state for a non-pinned safe */
export interface NonPinnedWarningState {
  /** Whether the warning should be shown */
  shouldShowWarning: boolean
  /** The safe address being viewed */
  safeAddress: string
  /** The safe name from address book */
  safeName?: string
  /** The chain ID of the safe */
  chainId: string
  /** The user's role (owner, proposer, or viewer) */
  userRole: SafeUserRole
  /** Whether the warning has been dismissed for this session */
  isDismissed: boolean
  /** Whether the confirmation dialog is open */
  isConfirmDialogOpen: boolean
  /** Whether the current safe has a similar address to another user's safe */
  hasSimilarAddress: boolean
  /** List of similar addresses found in user's safes */
  similarAddresses: SimilarAddressInfo[]

  // Actions
  /** Open the confirmation dialog */
  openConfirmDialog: () => void
  /** Close the confirmation dialog */
  closeConfirmDialog: () => void
  /** Add the safe to the pinned list (called after confirmation) */
  confirmAndAddToPinnedList: (name: string) => void
  /** Temporarily dismiss the warning for this session */
  dismiss: () => void
}
