/**
 * View models for the workspace address book. The views only render these; the app derives them
 * from the address book, the local address book and the chain configs.
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
  /** Display name of the member who added the contact. */
  addedBy?: string
  /** A contact from this browser's local address book, not the workspace one. */
  isLocal?: boolean
  /** A local contact the workspace address book already has. */
  isShared?: boolean
}

/** What the current member may do to a contact from its row menu. */
export type AddressBookPermissions = {
  canEdit: boolean
  canDelete: boolean
}

export const FULL_PERMISSIONS: AddressBookPermissions = { canEdit: true, canDelete: true }

export const NO_PERMISSIONS: AddressBookPermissions = { canEdit: false, canDelete: false }
