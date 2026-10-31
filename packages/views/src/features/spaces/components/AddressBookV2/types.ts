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
