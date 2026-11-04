/**
 * Cluster presentation across two rendered sublists: each list bands its own members; a cluster
 * spanning both lists can't be boxed, so each member gets an inline ⚠️ pointing at its peers.
 */

type Addressed = { address: string }

/** A look-alike peer (lowercased) and the chains it was listed on. */
export type SimilarPeer = { address: string; chainIds: string[] }

/** A row's cross-list look-alike peers, grouped by list. Only clusters spanning both lists get one. */
export type SimilarWarning = { trusted: SimilarPeer[]; owned: SimilarPeer[] }

/** Address → cluster id for one list's look-alikes, deduped so a multi-chain safe isn't listed twice. */
export const bandGroupsForList = (items: Addressed[], groupIdByAddress: Map<string, string>): Map<string, string> => {
  const result = new Map<string, string>()
  for (const address of new Set(items.map((item) => item.address.toLowerCase()))) {
    const group = groupIdByAddress.get(address)
    if (group) result.set(address, group)
  }
  return result
}

/** Per-address ⚠️ payload (peers grouped by list) for clusters that span BOTH lists. */
export const buildSimilarWarnings = (
  trustedItems: Array<Addressed & { chainId: string }>,
  ownedItems: Array<Addressed & { chainId: string }>,
  groupIdByAddress: Map<string, string>,
): Map<string, SimilarWarning> => {
  const trustedSet = new Set(trustedItems.map((item) => item.address.toLowerCase()))
  const ownedSet = new Set(ownedItems.map((item) => item.address.toLowerCase()))
  const chainIdsByAddress = new Map<string, Set<string>>()
  for (const { address, chainId } of [...trustedItems, ...ownedItems]) {
    const key = address.toLowerCase()
    chainIdsByAddress.set(key, (chainIdsByAddress.get(key) ?? new Set()).add(chainId))
  }
  const toPeer = (address: string): SimilarPeer => ({
    address,
    chainIds: Array.from(chainIdsByAddress.get(address) ?? []),
  })

  const byCluster = new Map<string, { trusted: string[]; owned: string[] }>()
  for (const address of new Set([...trustedSet, ...ownedSet])) {
    const group = groupIdByAddress.get(address)
    if (!group) continue
    const entry = byCluster.get(group) ?? { trusted: [], owned: [] }
    ;(trustedSet.has(address) ? entry.trusted : entry.owned).push(address)
    byCluster.set(group, entry)
  }

  const result = new Map<string, SimilarWarning>()
  for (const { trusted, owned } of byCluster.values()) {
    // Cross-list only: the cluster must reach into both sections.
    if (trusted.length === 0 || owned.length === 0) continue
    for (const address of [...trusted, ...owned]) {
      result.set(address, {
        trusted: trusted.filter((peer) => peer !== address).map(toPeer),
        owned: owned.filter((peer) => peer !== address).map(toPeer),
      })
    }
  }
  return result
}
