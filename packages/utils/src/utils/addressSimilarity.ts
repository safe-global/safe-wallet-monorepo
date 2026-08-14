/**
 * Address Similarity Detection Service
 *
 * Detects address-poisoning look-alikes — addresses that resemble ones the user
 * trusts (UIs show `0x1234…5678`, hiding the middle). Two detectors work together:
 *
 *  - ANCHOR: a candidate matches a TRUSTED anchor on the front OR back
 *    (both ends → CRITICAL, one end → WARN). Used where a trusted reference exists.
 *  - INTRA-LIST: two candidates in the same list match on front AND back. Used
 *    where nothing is trusted yet (e.g. choosing which owned Safes to add).
 */

import { Severity } from '../features/safe-shield/types'
import { isSeverityHigherOrEqual } from '../features/safe-shield/utils/analysisUtils'
import type {
  SimilarityConfig,
  SimilarityGroup,
  SimilarityDetectionResult,
  AnchorSimilarityConfig,
  SimilarityIndex,
  SimilarityMatch,
  ListAnnotation,
} from './addressSimilarity.types'
import { DEFAULT_SIMILARITY_CONFIG, DEFAULT_ANCHOR_SIMILARITY_CONFIG } from './addressSimilarity.types'

/**
 * Get the bucket key for an address based on prefix and suffix
 */
export const getBucketKey = (address: string, prefixLength: number, suffixLength: number): string => {
  const hex = normalizeAddress(address)
  const prefix = hex.slice(0, prefixLength)
  const suffix = hex.slice(-suffixLength)
  return `${prefix}_${suffix}`
}

/**
 * Detect addresses that resemble each other within a single list (intra-list).
 *
 * Buckets by prefix+suffix (front AND back must match) and flags every address in a
 * bucket of 2+. Used where no trusted reference exists yet (e.g. choosing which owned
 * Safes to add) — the anchor detector handles the "resembles something you trust" case.
 *
 * @param addresses - All addresses to analyze
 * @param config - Prefix/suffix lengths to bucket on
 * @returns Detection result with groups of similar addresses
 */
export const detectSimilarAddresses = (
  addresses: string[],
  config: SimilarityConfig = DEFAULT_SIMILARITY_CONFIG,
): SimilarityDetectionResult => {
  // Normalize all addresses to lowercase
  const normalizedAddresses = addresses.map((addr) => addr.toLowerCase())

  // Create buckets by prefix+suffix
  const buckets = new Map<string, string[]>()
  for (const addr of normalizedAddresses) {
    const key = getBucketKey(addr, config.prefixLength, config.suffixLength)
    const bucket = buckets.get(key) || []
    bucket.push(addr)
    buckets.set(key, bucket)
  }

  // Filter buckets and create similarity groups
  const groups: SimilarityGroup[] = []
  const addressToGroups = new Map<string, string[]>()

  for (const [bucketKey, addrs] of buckets) {
    // A shared prefix+suffix bucket IS the similarity signal; dedupe case-insensitively.
    const similarAddresses = Array.from(new Set(addrs))
    if (similarAddresses.length < 2) continue

    // Create similarity group - flag ALL similar addresses
    const group: SimilarityGroup = {
      bucketKey,
      addresses: similarAddresses,
    }
    groups.push(group)

    // Update address-to-groups mapping for ALL addresses in the group
    for (const addr of similarAddresses) {
      const existing = addressToGroups.get(addr) || []
      existing.push(bucketKey)
      addressToGroups.set(addr, existing)
    }
  }

  return {
    groups,
    addressToGroups,
    isFlagged: (address: string) => {
      const normalizedAddr = address.toLowerCase()
      return addressToGroups.has(normalizedAddr)
    },
    getGroup: (address: string) => {
      const normalizedAddr = address.toLowerCase()
      const groupKeys = addressToGroups.get(normalizedAddr)
      if (!groupKeys || groupKeys.length === 0) return undefined
      return groups.find((g) => g.bucketKey === groupKeys[0])
    },
  }
}

export interface ListClusterResult {
  /** Lowercased 0x-prefixed addresses that look alike another list member. */
  flagged: Set<string>
  /** Lowercased address → its cluster id, for boxing look-alikes together. */
  groupIdByAddress: Map<string, string>
}

interface Clusters {
  /** The address that represents x's cluster (x itself until it's clustered with someone). */
  leaderOf: (address: string) => string
  /** Put a and b into the same cluster. */
  putInSameCluster: (a: string, b: string) => void
}

/**
 * Tracks which addresses belong together. Every address points at another address in its cluster;
 * follow that chain to reach the cluster's "leader". Merging two clusters = point one leader at the other.
 */
const createClusters = (): Clusters => {
  const leader = new Map<string, string>()

  const leaderOf = (address: string): string => {
    const up = leader.get(address)
    return up === undefined || up === address ? address : leaderOf(up)
  }

  return {
    leaderOf,
    putInSameCluster: (a, b) => {
      const leaderA = leaderOf(a)
      const leaderB = leaderOf(b)
      if (leaderA !== leaderB) leader.set(leaderA, leaderB) // A's cluster now follows B's → one cluster
    },
  }
}

/** Dedupe addresses by normalized value, keeping the first lowercased original as the map key's value. */
const dedupeUsableAddresses = (addresses: string[]): Map<string, string> => {
  const originalByNorm = new Map<string, string>()
  for (const address of addresses) {
    const normalized = normalizeAddress(address)
    if (isUsableAddress(normalized) && !originalByNorm.has(normalized)) {
      originalByNorm.set(normalized, address.toLowerCase())
    }
  }
  return originalByNorm
}

/**
 * Bucket addresses by `keyOf`, then merge everyone in each shared bucket into one cluster.
 * Addresses that land in the same bucket share the key, so they all look alike.
 */
const mergeAddressesSharingKey = (
  addresses: string[],
  keyOf: (address: string) => string,
  clusters: Clusters,
): void => {
  const bucketByKey = new Map<string, string[]>()
  for (const address of addresses) {
    const key = keyOf(address)
    const bucket = bucketByKey.get(key) ?? []
    bucket.push(address)
    bucketByKey.set(key, bucket)
  }

  for (const bucket of bucketByKey.values()) {
    // Everyone in this bucket looks alike → put them all in one cluster.
    for (const address of bucket.slice(1)) clusters.putInSameCluster(address, bucket[0])
  }
}

/** Link any two addresses that share the same first-N OR last-N hex. */
const linkBySharedAffix = (uniqueAddresses: string[], clusters: Clusters, config: SimilarityConfig): void => {
  const firstN = (address: string) => address.slice(0, config.prefixLength)
  const lastN = (address: string) => address.slice(-config.suffixLength)

  mergeAddressesSharingKey(uniqueAddresses, firstN, clusters)
  mergeAddressesSharingKey(uniqueAddresses, lastN, clusters)
}

/** Flag every address whose cluster has 2+ members, stamping the cluster leader as its cluster id. */
const collectClusters = (
  uniqueAddresses: string[],
  clusters: Clusters,
  originalByNorm: Map<string, string>,
): ListClusterResult => {
  const membersByLeader = new Map<string, string[]>()
  for (const address of uniqueAddresses) {
    const leader = clusters.leaderOf(address)
    const members = membersByLeader.get(leader)
    if (members) members.push(address)
    else membersByLeader.set(leader, [address])
  }

  const flagged = new Set<string>()
  const groupIdByAddress = new Map<string, string>()
  for (const [leader, members] of membersByLeader) {
    if (members.length < 2) continue
    for (const address of members) {
      const original = originalByNorm.get(address) as string
      flagged.add(original)
      groupIdByAddress.set(original, leader)
    }
  }
  return { flagged, groupIdByAddress }
}

/**
 * Cluster a list's look-alikes by the OR rule: two addresses connect when they share first-N OR
 * last-N hex (union-find). Every member of a component of 2+ is flagged with that component's id.
 * Identical addresses are deduped first, so the same Safe on several chains never self-matches.
 */
export const detectIntraListClusters = (
  addresses: string[],
  config: SimilarityConfig = DEFAULT_SIMILARITY_CONFIG,
): ListClusterResult => {
  const originalByNorm = dedupeUsableAddresses(addresses)
  const uniqueAddresses = Array.from(originalByNorm.keys())
  if (uniqueAddresses.length < 2) return { flagged: new Set(), groupIdByAddress: new Map() }

  const clusters = createClusters()
  linkBySharedAffix(uniqueAddresses, clusters, config)

  return collectClusters(uniqueAddresses, clusters, originalByNorm)
}

// Anchor detector — build the index once over the user's trusted anchors, then query each candidate.

/** Strip a leading `0x` (any case) and lowercase. Pure & synchronous. */
export const normalizeAddress = (address: string): string => {
  const lower = address.trim().toLowerCase()
  return lower.startsWith('0x') ? lower.slice(2) : lower
}

/** True for an empty string or an all-zero (zero/burn) address. */
const isBlankOrZeroAddress = (normalized: string): boolean => normalized.length === 0 || /^0+$/.test(normalized)

/** A well-formed 20-byte address in normalized form (no `0x`, lowercase hex). */
const NORMALIZED_ADDRESS = /^[0-9a-f]{40}$/

/** A candidate/anchor worth indexing or querying: well-formed 20-byte hex, and not the zero address. */
const isUsableAddress = (normalized: string): boolean =>
  NORMALIZED_ADDRESS.test(normalized) && !isBlankOrZeroAddress(normalized)

/** Number of leading characters two strings share before the first difference. */
export const longestCommonPrefixLen = (a: string, b: string): number => {
  const max = Math.min(a.length, b.length)
  let i = 0
  while (i < max && a[i] === b[i]) i++
  return i
}

/** Number of trailing characters two strings share before the first difference. */
export const longestCommonSuffixLen = (a: string, b: string): number => {
  const max = Math.min(a.length, b.length)
  let i = 0
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
  return i
}

/**
 * Length (in hex chars, ignoring `0x` and case) of the matching front and back that two addresses
 * share — the "look-alike" overlap. Reusable for highlighting the matching ends of an address pair.
 */
export const getCommonAffixLengths = (a: string, b: string): { prefixLen: number; suffixLen: number } => {
  const na = normalizeAddress(a)
  const nb = normalizeAddress(b)
  return { prefixLen: longestCommonPrefixLen(na, nb), suffixLen: longestCommonSuffixLen(na, nb) }
}

/** Build a match for a candidate against one anchor, or null if not similar / identical. */
const buildMatch = (candidate: string, anchor: string, config: AnchorSimilarityConfig): SimilarityMatch | null => {
  if (candidate === anchor) return null // identity, not poisoning
  const prefixLen = longestCommonPrefixLen(candidate, anchor)
  const suffixLen = longestCommonSuffixLen(candidate, anchor)
  const hitPrefix = prefixLen >= config.prefixThreshold
  const hitSuffix = suffixLen >= config.suffixThreshold
  if (!hitPrefix && !hitSuffix) return null
  const severity = hitPrefix && hitSuffix ? Severity.CRITICAL : Severity.WARN
  return { anchor, prefixLen, suffixLen, severity }
}

/** Prefer higher severity; tie-break on more matched characters (L + S). */
const isStrongerMatch = (a: SimilarityMatch, b: SimilarityMatch): boolean =>
  a.severity !== b.severity
    ? isSeverityHigherOrEqual(a.severity, b.severity)
    : a.prefixLen + a.suffixLen > b.prefixLen + b.suffixLen

/**
 * Build an index over the user's trusted anchor addresses for cheap per-candidate
 * lookups. Anchors are normalized, deduped, and zero/burn addresses dropped.
 */
export const buildSimilarityIndex = (
  anchors: string[],
  config: AnchorSimilarityConfig = DEFAULT_ANCHOR_SIMILARITY_CONFIG,
): SimilarityIndex => {
  // Clamp thresholds to >= 1. A 0 threshold makes `longestCommon*Len >= 0` trivially true, so every
  // non-identical address would match on that end (and the buckets collapse) → everything flagged.
  // Not reachable via the default config, but protects callers that tune thresholds.
  const safeConfig: AnchorSimilarityConfig = {
    prefixThreshold: Math.max(1, config.prefixThreshold),
    suffixThreshold: Math.max(1, config.suffixThreshold),
  }
  // Bucket on the shorter of the two thresholds so every OR-qualifying pair shares
  // at least one bucket: a prefix match (>= prefixThreshold >= keyLen) lands in the
  // same prefix bucket, a suffix match (>= suffixThreshold >= keyLen) in the same
  // suffix bucket. Thus the bucket lookup never misses a real match.
  const keyLen = Math.min(safeConfig.prefixThreshold, safeConfig.suffixThreshold)
  const anchorSet = new Set<string>()
  const prefixBuckets = new Map<string, string[]>()
  const suffixBuckets = new Map<string, string[]>()

  const pushTo = (map: Map<string, string[]>, key: string, value: string): void => {
    const bucket = map.get(key)
    if (bucket) bucket.push(value)
    else map.set(key, [value])
  }

  for (const raw of anchors) {
    const normalized = normalizeAddress(raw)
    // Only index well-formed, non-zero 20-byte addresses (a corrupted persisted value must not seed
    // the index), and dedupe.
    if (!isUsableAddress(normalized) || anchorSet.has(normalized)) continue
    anchorSet.add(normalized)
    pushTo(prefixBuckets, normalized.slice(0, keyLen), normalized)
    pushTo(suffixBuckets, normalized.slice(-keyLen), normalized)
  }

  const isAnchor = (address: string): boolean => anchorSet.has(normalizeAddress(address))

  const query = (address: string): SimilarityMatch | null => {
    const normalized = normalizeAddress(address)
    // Skip malformed/zero, or exact-anchor (incl. cross-chain replica = identity) candidates.
    if (!isUsableAddress(normalized) || anchorSet.has(normalized)) return null

    const candidates = new Set<string>()
    for (const anchor of prefixBuckets.get(normalized.slice(0, keyLen)) ?? []) candidates.add(anchor)
    for (const anchor of suffixBuckets.get(normalized.slice(-keyLen)) ?? []) candidates.add(anchor)

    let best: SimilarityMatch | null = null
    for (const anchor of candidates) {
      const match = buildMatch(normalized, anchor, safeConfig)
      if (match && (best === null || isStrongerMatch(match, best))) best = match
    }
    return best
  }

  return { isAnchor, query, size: anchorSet.size }
}

/**
 * Annotate each address in a list with its strongest anchor match (Mode B).
 * An address that is itself an anchor is never marked (it is the trusted original).
 *
 * Keyed by the lowercased address (the original, case-preserved value is kept on
 * `ListAnnotation.address`); query the result with `addr.toLowerCase()`.
 */
export const detectAnchorMatches = (addresses: string[], index: SimilarityIndex): Map<string, ListAnnotation> => {
  const annotations = new Map<string, ListAnnotation>()
  for (const address of addresses) {
    const match = index.isAnchor(address) ? undefined : (index.query(address) ?? undefined)
    annotations.set(address.toLowerCase(), { address, match })
  }
  return annotations
}
