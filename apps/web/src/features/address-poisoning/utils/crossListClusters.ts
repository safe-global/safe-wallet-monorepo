/**
 * Presentation policy for look-alike clusters rendered across two sublists (e.g. the onboarding
 * "My accounts" / "Owned safe accounts" split): each list visually bands its own cluster members,
 * and a cluster that spans BOTH lists — which a single band can't box — marks each member with an
 * inline ⚠️ pointing at its peers. Pure derivations over `groupIdByAddress` from useSimilarityClusters.
 */

/** Anything with an address — keeps this module decoupled from safe-item shapes. */
type Addressed = { address: string }

/**
 * A row's look-alike peers, grouped by the list they live in. Present only for clusters that span
 * both lists; same-list look-alikes read from their band alone and produce no warning.
 */
export type SimilarWarning = { trusted: string[]; owned: string[] }

/**
 * Address → cluster id for every look-alike in one list (deduped by address, so a multi-chain safe
 * isn't listed twice). ≥2 members in a list read as one banded group, a lone cross-list member as a
 * single boxed card. The ⚠️ (see buildSimilarWarnings) marks the cross-list case.
 */
export const bandGroupsForList = (items: Addressed[], groupIdByAddress: Map<string, string>): Map<string, string> => {
  const result = new Map<string, string>()
  for (const address of new Set(items.map((item) => item.address.toLowerCase()))) {
    const group = groupIdByAddress.get(address)
    if (group) result.set(address, group)
  }
  return result
}

/**
 * Per-address ⚠️ payload for clusters that span BOTH lists. Each member of such a cluster gets its
 * look-alike peers grouped by list, for the icon's tooltip.
 */
export const buildSimilarWarnings = (
  trustedItems: Addressed[],
  ownedItems: Addressed[],
  groupIdByAddress: Map<string, string>,
): Map<string, SimilarWarning> => {
  const trustedSet = new Set(trustedItems.map((item) => item.address.toLowerCase()))
  const ownedSet = new Set(ownedItems.map((item) => item.address.toLowerCase()))

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
        trusted: trusted.filter((peer) => peer !== address),
        owned: owned.filter((peer) => peer !== address),
      })
    }
  }
  return result
}
