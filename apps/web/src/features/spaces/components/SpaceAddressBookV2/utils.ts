import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { AddressBookContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import type { AddressBookState } from '@/store/addressBookSlice'

const toChainInfos = (chainIds: string[], configs: Chain[]): ChainInfo[] =>
  chainIds.map((chainId) => {
    const chain = configs.find((config) => config.chainId === chainId)
    return chain
      ? { chainId, chainName: chain.chainName, chainLogoUri: chain.chainLogoUri ?? null, shortName: chain.shortName }
      : { chainId, chainName: chainId, chainLogoUri: null, shortName: chainId }
  })

export const toWorkspaceContacts = (
  items: SpaceAddressBookItemDto[],
  configs: Chain[],
  resolveMemberName: (userId: number | undefined) => string | undefined,
): AddressBookContact[] =>
  items.map((item) => ({
    address: item.address,
    name: item.name,
    chains: toChainInfos(item.chainIds, configs),
    addedBy: resolveMemberName(item.createdByUserId) || item.createdBy || undefined,
  }))

/** This browser's contacts, one per address across chains; those the workspace already has go last. */
export const toLocalContacts = (
  localBooks: AddressBookState,
  workspaceItems: SpaceAddressBookItemDto[],
  configs: Chain[],
): AddressBookContact[] => {
  const byAddress = new Map<string, { address: string; name: string; chainIds: Set<string> }>()
  for (const [chainId, book] of Object.entries(localBooks)) {
    for (const [address, name] of Object.entries(book)) {
      const key = address.toLowerCase()
      const existing = byAddress.get(key)
      if (existing) existing.chainIds.add(chainId)
      else byAddress.set(key, { address, name, chainIds: new Set([chainId]) })
    }
  }

  const shared = new Set(workspaceItems.map((item) => item.address.toLowerCase()))

  return Array.from(byAddress.values())
    .map(({ address, name, chainIds }) => ({
      address,
      name,
      chains: toChainInfos(Array.from(chainIds), configs),
      isShared: shared.has(address.toLowerCase()),
    }))
    .sort((a, b) => Number(a.isShared) - Number(b.isShared))
}

type AddressBookKey = { chainId: string; address: string }

export const storedKeysOf = (
  localBooks: AddressBookState,
  address: string,
  chainIds: string[] = Object.keys(localBooks),
): AddressBookKey[] =>
  chainIds.flatMap((chainId) =>
    Object.keys(localBooks[chainId] ?? {})
      .filter((key) => sameAddress(key, address))
      .map((key) => ({ chainId, address: key })),
  )

/** After a save, the other casings of the saved address on the contact's chains, which still hold the old name. */
export const staleCasingKeys = (
  before: AddressBookState,
  after: AddressBookState,
  address: string,
  chainIds: string[],
): AddressBookKey[] => {
  const keys = storedKeysOf(after, address, chainIds)
  const saved = keys.find(({ chainId, address: key }) => before[chainId]?.[key] !== after[chainId][key])
  return saved ? keys.filter((key) => key.address !== saved.address) : []
}
