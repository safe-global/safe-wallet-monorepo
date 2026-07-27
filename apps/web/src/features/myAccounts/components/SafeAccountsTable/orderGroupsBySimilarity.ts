import type { AccountGroup } from './useSafeAccountRows'

/**
 * Pulls each similarity cluster's members together so they render as one contiguous band. The whole
 * cluster is placed at its LEAD's sorted position — the lead is the anchor (a vetted/pinned member in
 * `anchorAddresses`) if present, otherwise the first member in sort order. Within the band the
 * anchor(s) lead, then the look-alikes keep their sorted order. Non-clustered groups stay in place.
 * No-op when `similarityGroups` is empty.
 */
export const orderGroupsBySimilarity = (
  groups: AccountGroup[],
  similarityGroups?: Map<string, string>,
  anchorAddresses?: Set<string>,
): AccountGroup[] => {
  if (!similarityGroups || similarityGroups.size === 0) return groups

  const clusterOf = (group: AccountGroup) => similarityGroups.get(group.parent.address.toLowerCase())
  const isAnchor = (group: AccountGroup) => Boolean(anchorAddresses?.has(group.parent.address.toLowerCase()))

  const membersByCluster = new Map<string, AccountGroup[]>()
  const leadByCluster = new Map<string, AccountGroup>()
  for (const group of groups) {
    const cluster = clusterOf(group)
    if (!cluster) continue
    const members = membersByCluster.get(cluster)
    if (members) members.push(group)
    else membersByCluster.set(cluster, [group])
    // Lead = first-seen member (first in sort order), upgraded to an anchor if one appears.
    const lead = leadByCluster.get(cluster)
    if (!lead || (isAnchor(group) && !isAnchor(lead))) leadByCluster.set(cluster, group)
  }

  const result: AccountGroup[] = []
  for (const group of groups) {
    const cluster = clusterOf(group)
    if (!cluster) {
      result.push(group)
      continue
    }
    // Emit the whole cluster once, at its lead's position; skip the other members here.
    if (leadByCluster.get(cluster) !== group) continue
    // Every clustered group was collected in the first loop, so the members always exist.
    const anchors: AccountGroup[] = []
    const rest: AccountGroup[] = []
    for (const member of membersByCluster.get(cluster) ?? []) {
      ;(isAnchor(member) ? anchors : rest).push(member)
    }
    result.push(...anchors, ...rest)
  }
  return result
}
