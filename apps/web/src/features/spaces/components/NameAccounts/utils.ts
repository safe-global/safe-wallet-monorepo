import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  flattenSafeItems,
  isMultiChainSafeItem,
  type AllSafeItems,
  type SafeItem,
} from '@/hooks/safes'
import type { WorkspaceSafeName } from '../../hooks/useUpsertWorkspaceSafeName'
import { validateContactName } from '../SpaceAddressBook/utils'

type SafeRef = { chainId: string; address: string }

/** Form field path for a Safe's name, keyed by lowercased address so one name covers all its chains. */
export const nameFieldKey = (address: string) => `names.${address.toLowerCase()}` as const

/**
 * Safes being added that still need a workspace name, one row per address. A workspace entry that
 * misses one of the target chains still needs the upsert, so that Safe is listed with the entry's
 * name prefilled; otherwise the prefill is the user's local name.
 */
export const getSafesToName = (
  safesToAdd: SafeRef[],
  allSafes: AllSafeItems,
  spaceAddressBook: SpaceAddressBookItemDto[],
): AllSafeItems => {
  const knownSafes = flattenSafeItems(allSafes)

  const items = safesToAdd.flatMap<SafeItem>(({ chainId, address }) => {
    const entry = spaceAddressBook.find((item) => sameAddress(item.address, address))
    if (entry?.chainIds.includes(chainId)) return []

    const known = knownSafes.find((safe) => safe.chainId === chainId && sameAddress(safe.address, address))
    return [
      {
        chainId,
        address,
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
        ...known,
        name: entry?.name ?? known?.name,
      },
    ]
  })

  const multiChain = _getMultiChainAccounts(items)
  return [...multiChain, ..._getSingleChainAccounts(items, multiChain)]
}

/** The address book items to upsert: one per named Safe, spanning every chain it was added on. */
export const buildWorkspaceSafeNames = (
  names: Record<string, string>,
  safesToName: AllSafeItems,
): WorkspaceSafeName[] =>
  safesToName.map((item) => ({
    address: item.address,
    name: names[item.address.toLowerCase()] ?? '',
    chainIds: isMultiChainSafeItem(item) ? item.safes.map((safe) => safe.chainId) : [item.chainId],
  }))

/**
 * Whether every Safe in the naming step has a name the workspace address book accepts — gates the
 * submit button. A prefilled name never mounts its input, so this is the only validation it gets.
 */
export const hasAllNames = (names: Record<string, string> | undefined, safesToName: AllSafeItems): boolean =>
  safesToName.every((item) => validateContactName(names?.[item.address.toLowerCase()] ?? '') === undefined)
