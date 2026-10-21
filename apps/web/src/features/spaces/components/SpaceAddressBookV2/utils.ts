import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
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
      isLocal: true,
      isShared: shared.has(address.toLowerCase()),
    }))
    .sort((a, b) => Number(a.isShared) - Number(b.isShared))
}
