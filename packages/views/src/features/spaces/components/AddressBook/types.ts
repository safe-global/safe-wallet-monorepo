/**
 * View models for the workspace address book. The views only render these; the app derives them
 * from the address book, the workspace Safes and the resolved contact types.
 */

export type ChainInfo = {
  chainId: string
  name: string
  logoUri?: string
}

/**
 * What an address is. `workspace-safe` is one of this workspace's Safes; the rest come from the
 * on-chain lookup. `unknown` means the lookup found nothing; `loading` means it has not finished.
 */
export type ContactCategory = 'workspace-safe' | 'safe' | 'contract' | 'eoa' | 'unknown' | 'loading'

export const CATEGORY_LABELS: Record<Exclude<ContactCategory, 'unknown' | 'loading'>, string> = {
  'workspace-safe': 'Workspace Safe',
  safe: 'Safe account',
  contract: 'Contract',
  eoa: 'EOA',
}

/** Values of the Category filter. `signer` matches contacts that sign a workspace Safe. */
export type CategoryFilterValue = Exclude<ContactCategory, 'loading'> | 'signer'

export const CATEGORY_FILTER_OPTIONS: { value: CategoryFilterValue; label: string }[] = [
  { value: 'workspace-safe', label: 'Workspace Safe' },
  { value: 'safe', label: 'Safe account' },
  { value: 'contract', label: 'Contract' },
  { value: 'eoa', label: 'EOA' },
  { value: 'signer', label: 'Signer' },
  { value: 'unknown', label: 'Not sure' },
]

export type AddressBookContact = {
  address: string
  name: string
  chains: ChainInfo[]
  category: ContactCategory
  /** Names of the workspace Safes this address signs for. Empty when it signs none. */
  signerOf: string[]
  /** Team-written labels. Local contacts have none. */
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
  categories: CategoryFilterValue[]
  tags: string[]
}

export const EMPTY_FILTERS: ContactFilters = { query: '', categories: [], tags: [] }

/** A workspace signer that is not in the address book yet. */
export type MissingSigner = {
  address: string
  chains: ChainInfo[]
  /** Names of the workspace Safes it signs for. */
  safes: string[]
  /** Saved when the name is left empty, e.g. "Treasury signer 2". */
  placeholder: string
}

export type TagCount = { tag: string; count: number }
