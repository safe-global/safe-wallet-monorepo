import type { SpaceAddressBookTagDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

export type WorkspaceTag = SpaceAddressBookTagDto

export type ContactTag = Pick<WorkspaceTag, 'id' | 'name' | 'color'>

export type AddressBookContact = {
  address: string
  name: string
  chains: ChainInfo[]
  /** The member's name, else their wallet address or email. */
  addedBy?: string
  /** A local contact the workspace address book already has. */
  isShared?: boolean
  /** Workspace contacts only; local contacts have none. */
  tags?: ContactTag[]
}

export type SuggestionReason = { kind: 'signer'; safes: string[] }

export type SuggestedContact = {
  address: string
  chains: ChainInfo[]
  suggestedName: string
  reason: SuggestionReason
}

export const describeSuggestion = (reason: SuggestionReason): string =>
  reason.safes.length === 1 ? `Signer of ${reason.safes[0]}` : `Signer of ${reason.safes.length} Safes`

export type PendingRequest = {
  id: number
  address: string
  name: string
  chains: ChainInfo[]
  /** The member's name, else their wallet address or email. */
  requestedBy?: string
  /** Approving replaces the Workspace contact that already has this address. */
  isInWorkspace: boolean
}
