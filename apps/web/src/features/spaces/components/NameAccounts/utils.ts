import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form'
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
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import type { WorkspaceSafeName } from '../../hooks/useUpsertWorkspaceSafeName'
import { validateContactName } from '../SpaceAddressBook/utils'

type SafeRef = { chainId: string; address: string }

/** Form field path for a Safe's name, keyed by lowercased address so one name covers all its chains. */
export const nameFieldKey = (address: string) => `names.${address.toLowerCase()}` as const

/** Replaces each Safe's name with the workspace one where the workspace names it on that chain. */
export const withWorkspaceNames = (safes: SafeItem[], spaceAddressBook: SpaceAddressBookItemDto[]): SafeItem[] =>
  safes.map((safe) => {
    const entry = spaceAddressBook.find((item) => sameAddress(item.address, safe.address))
    return entry?.chainIds.includes(safe.chainId) ? { ...safe, name: entry.name } : safe
  })

/** Returns the Safes that still need a workspace name, grouped one row per address. */
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

/** Returns true when every name passes the address book validation rules. */
export const hasAllNames = (names: Record<string, string> | undefined, safesToName: AllSafeItems): boolean =>
  safesToName.every((item) => validateContactName(names?.[item.address.toLowerCase()] ?? '') === undefined)

/** Marks every name field touched, so the empty ones show their error. */
export const touchNames = (
  getValues: UseFormGetValues<AddAccountsFormValues>,
  setValue: UseFormSetValue<AddAccountsFormValues>,
  safesToName: AllSafeItems,
) => {
  for (const item of safesToName) {
    const key = nameFieldKey(item.address)
    setValue(key, getValues(key) ?? '', { shouldTouch: true })
  }
}
