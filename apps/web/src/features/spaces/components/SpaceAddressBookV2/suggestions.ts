import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ADDRESS_BOOK_NAME_MAX_LENGTH } from '@safe-global/utils/validation/names'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import type { SignedSafe, WorkspaceSigner } from '../../hooks/useWorkspaceSigners'
import { toChainInfos } from './utils'

export const safeLabel = ({ name, address }: SignedSafe): string =>
  name || `Safe ${address.slice(0, 6)}...${address.slice(-4)}`

export const suggestedSignerName = (safe: SignedSafe): string => {
  const suffix = ` signer ${safe.position}`
  const label = Array.from(safeLabel(safe))
    .slice(0, ADDRESS_BOOK_NAME_MAX_LENGTH - suffix.length)
    .join('')
    .trimEnd()
  return `${label}${suffix}`
}

const bySafeLabel = (a: SignedSafe, b: SignedSafe): number =>
  safeLabel(a).localeCompare(safeLabel(b)) || a.address.toLowerCase().localeCompare(b.address.toLowerCase())

export const toSuggestedContacts = (
  signers: WorkspaceSigner[],
  workspaceItems: SpaceAddressBookItemDto[],
  configs: Chain[],
): SuggestedContact[] =>
  signers
    .filter((signer) => !workspaceItems.some((item) => sameAddress(item.address, signer.address)))
    .map((signer) => {
      const safes = [...signer.safes].sort(bySafeLabel)
      return {
        address: signer.address,
        chains: toChainInfos(signer.chainIds, configs),
        suggestedName: suggestedSignerName(safes[0]),
        reason: { kind: 'signer' as const, safes: safes.map(safeLabel) },
      }
    })
    .sort((a, b) => a.suggestedName.localeCompare(b.suggestedName))
