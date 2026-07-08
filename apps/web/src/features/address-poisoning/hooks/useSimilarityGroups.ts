import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { detectListSimilarities, detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { selectAnchorIndex } from '../store'

export interface SimilarityGroup {
  key: string
  /** Member addresses (original casing, in input order). */
  addresses: string[]
  /** True when the cluster contains a both-ends look-alike → red box; otherwise amber. */
  isCritical: boolean
}

export interface SimilarityGrouping {
  groups: SimilarityGroup[]
  ungrouped: string[]
}

/**
 * Cluster a list of addresses into groups of mutually/transitively similar ones (A~B, B~C ⇒ {A,B,C})
 * using union-find over intra-list buckets + anchor matches — the same grouping the nested-safe
 * curation uses, exposed for other list surfaces (e.g. Manage trusted Safes). An in-list anchor an
 * impostor resembles is pulled into the impostor's cluster so both are framed together.
 *
 * Flag-gated by ADDRESS_POISONING_PROTECTION. Pass a referentially-stable `addresses` array.
 */
const useSimilarityGroups = (addresses: string[]): SimilarityGrouping => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    if (!isEnabled || addresses.length === 0) return { groups: [], ungrouped: [...addresses] }

    const lower = (address: string) => address.toLowerCase()
    const inList = new Map(addresses.map((address) => [lower(address), address]))
    const anchorAnnotations = detectListSimilarities(addresses, anchorIndex)
    const intra = detectSimilarAddresses(addresses)

    const parent = new Map<string, string>()
    const ensure = (x: string) => {
      if (!parent.has(x)) parent.set(x, x)
    }
    const find = (x: string): string => {
      let root = x
      while (parent.get(root) !== root) root = parent.get(root) as string
      return root
    }
    const union = (a: string, b: string) => {
      ensure(a)
      ensure(b)
      const rootA = find(a)
      const rootB = find(b)
      if (rootA !== rootB) parent.set(rootA, rootB)
    }
    for (const address of addresses) ensure(lower(address))

    const flagged = new Set<string>()

    // 1. Intra-list buckets (front AND back).
    const buckets = new Map<string, string[]>()
    for (const address of addresses) {
      const group = intra.getGroup(address)
      if (!group) continue
      flagged.add(lower(address))
      const members = buckets.get(group.bucketKey) ?? []
      members.push(lower(address))
      buckets.set(group.bucketKey, members)
    }
    for (const members of buckets.values()) {
      for (let i = 1; i < members.length; i++) union(members[0], members[i])
    }

    // 2. Anchor matches — union impostor with its in-list anchor, and impostors sharing an anchor.
    const byAnchor = new Map<string, string[]>()
    anchorAnnotations.forEach((annotation, address) => {
      if (!annotation.match) return
      flagged.add(lower(address))
      const anchorLower = '0x' + annotation.match.anchor
      if (inList.has(anchorLower)) union(lower(address), anchorLower)
      const peers = byAnchor.get(annotation.match.anchor) ?? []
      peers.push(lower(address))
      byAnchor.set(annotation.match.anchor, peers)
    })
    for (const peers of byAnchor.values()) {
      for (let i = 1; i < peers.length; i++) union(peers[0], peers[i])
    }

    const isCritical = (members: string[]): boolean =>
      members.some(
        (address) => intra.isFlagged(address) || anchorAnnotations.get(address)?.match?.severity === Severity.CRITICAL,
      )

    // Collect connected components in input order.
    const components = new Map<string, string[]>()
    for (const address of addresses) {
      const root = find(lower(address))
      const members = components.get(root) ?? []
      members.push(address)
      components.set(root, members)
    }

    const groups: SimilarityGroup[] = []
    const ungrouped: string[] = []
    for (const [root, members] of components) {
      if (members.length >= 2 || flagged.has(lower(members[0]))) {
        groups.push({ key: `sim:${root}`, addresses: members, isCritical: isCritical(members) })
      } else {
        ungrouped.push(...members)
      }
    }

    return { groups, ungrouped }
  }, [isEnabled, addresses, anchorIndex])
}

export default useSimilarityGroups
