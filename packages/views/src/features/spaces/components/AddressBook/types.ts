/**
 * View models for the workspace address book. The views only render these; the app derives them
 * from the address book and the workspace Safes.
 */

export type ChainInfo = {
  chainId: string
  name: string
  logoUri?: string
}

export type AddressBookContact = {
  address: string
  name: string
  chains: ChainInfo[]
  /** One of this workspace's Safes. Adds the automatic "Workspace Safe" tag. */
  isWorkspaceSafe?: boolean
  /** Names of the workspace Safes this address signs for. Non-empty adds the automatic "Signer of a Safe" tag. */
  signerOf: string[]
  /** Team-written labels, without the automatic ones. Local contacts have none. */
  tags: string[]
  /** Display name of the member who added the contact. */
  addedBy?: string
  /** A contact from this browser's local address book, not the workspace one. */
  isLocal?: boolean
}

/** What the current member may do. Admins edit and delete; every active member edits tags. */
export type AddressBookPermissions = {
  canEdit: boolean
  canEditTags: boolean
  canDelete: boolean
  canAdd: boolean
  canImport: boolean
}

export const ADMIN_PERMISSIONS: AddressBookPermissions = {
  canEdit: true,
  canEditTags: true,
  canDelete: true,
  canAdd: true,
  canImport: true,
}

export const MEMBER_PERMISSIONS: AddressBookPermissions = {
  canEdit: false,
  canEditTags: true,
  canDelete: false,
  canAdd: false,
  canImport: false,
}

export type ContactFilters = {
  query: string
  /** Team-written and automatic tags alike; a contact must carry every one. */
  tags: string[]
}

export const EMPTY_FILTERS: ContactFilters = { query: '', tags: [] }

/** Why an address is suggested. */
export type SuggestionReason = { kind: 'signer'; safes: string[] } | { kind: 'frequent'; transactions: number }

/** An address worth adding to the workspace book that isn't in it yet. */
export type SuggestedContact = {
  address: string
  chains: ChainInfo[]
  /** Saved when the name is left empty, e.g. "Treasury signer 2". */
  suggestedName: string
  reason: SuggestionReason
}

export const describeSuggestion = (reason: SuggestionReason): string =>
  reason.kind === 'signer'
    ? `Signer of ${reason.safes.join(', ')}`
    : `${reason.transactions} ${reason.transactions === 1 ? 'transaction' : 'transactions'} with your Safes`

export type TagCount = { tag: string; count: number }
