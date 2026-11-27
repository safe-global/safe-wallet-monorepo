import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  AddressBookRequestItemDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { ADDRESS_BOOK_NAME_MAX_LENGTH } from '@safe-global/utils/validation/names'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import type { AddressBookState } from '@/store/addressBookSlice'
import type { SignedSafe, WorkspaceSigner } from '../../hooks/useWorkspaceSigners'
import { toChainInfos } from '../../utils'

export const safeLabel = ({ name, address }: SignedSafe): string => name || `Safe ${shortenAddress(address)}`

export const suggestedSignerName = (safe: SignedSafe): string => {
  const suffix = ` signer ${safe.position}`
  const label = Array.from(safeLabel(safe))
    .slice(0, ADDRESS_BOOK_NAME_MAX_LENGTH - suffix.length)
    .join('')
    .trimEnd()
  return `${label}${suffix}`
}

const byText = (a: string, b: string): number => a.localeCompare(b, undefined, { numeric: true })

const bySafeLabel = (a: SignedSafe, b: SignedSafe): number =>
  byText(safeLabel(a), safeLabel(b)) || a.address.toLowerCase().localeCompare(b.address.toLowerCase())

/** Pending requests + local address books */
type HiddenSources = { pendingRequests?: AddressBookRequestItemDto[]; localBooks?: AddressBookState }

const hiddenAddresses = (
  workspaceItems: SpaceAddressBookItemDto[],
  { pendingRequests = [], localBooks = {} }: HiddenSources,
): Set<string> =>
  new Set(
    [
      ...workspaceItems.map((item) => item.address),
      ...pendingRequests.map((request) => request.address),
      ...Object.values(localBooks).flatMap((book) => Object.keys(book)),
    ].map((address) => address.toLowerCase()),
  )

export const toSuggestedContacts = (
  signers: WorkspaceSigner[],
  workspaceItems: SpaceAddressBookItemDto[],
  configs: Chain[],
  hidden: HiddenSources = {},
): SuggestedContact[] => {
  const hiddenSet = hiddenAddresses(workspaceItems, hidden)
  return signers
    .filter((signer) => !hiddenSet.has(signer.address.toLowerCase()))
    .map((signer) => {
      const safes = [...signer.safes].sort(bySafeLabel)
      return {
        address: signer.address,
        chains: toChainInfos(signer.chainIds, configs),
        suggestedName: suggestedSignerName(safes[0]),
        reason: { kind: 'signer' as const, safes: safes.map(safeLabel) },
      }
    })
    .sort((a, b) => byText(a.suggestedName, b.suggestedName))
}
