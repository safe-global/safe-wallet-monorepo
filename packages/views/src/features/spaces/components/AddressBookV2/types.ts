import type { ChainInfo } from '@safe-global/views/features/spaces/types'

export type AddressBookContact = {
  address: string
  name: string
  chains: ChainInfo[]
  /** The member's name, else their wallet address or email. */
  addedBy?: string
  /** A local contact the workspace address book already has. */
  isShared?: boolean
}

export type SuggestionReason = { kind: 'signer'; safes: string[] }

export type SuggestedContact = {
  address: string
  chains: ChainInfo[]
  suggestedName: string
  reason: SuggestionReason
}

export const describeSuggestion = (reason: SuggestionReason): string => `Signer of ${reason.safes.join(', ')}`
