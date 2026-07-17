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

/**
 * Lowercase address set for every address that {@link detectSimilarAddresses} flags (intra-list).
 * Dedupes case-insensitively; returns an empty set when there are fewer than two distinct addresses.
 */
export const getFlaggedSimilarAddressSet = (addresses: string[]): Set<string> => {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]
  if (unique.length < 2) {
    return new Set()
  }
  const result = detectSimilarAddresses(unique)
  return new Set(unique.filter((addr) => result.isFlagged(addr)))
}

/** Look-alike clustering of a single list: flagged set + a group id per flagged address. */
export interface ListClusterResult {
  /** Lowercased (0x-prefixed) addresses that look alike another list member. Query with `addr.toLowerCase()`. */
  flagged: Set<string>
  /** Lowercased address → its cluster id (an opaque, stable key) for boxing look-alikes together. */
  groupIdByAddress: Map<string, string>
}

/**
 * Cluster the addresses in one list that look alike, using the OR rule: two addresses are connected
 * when they share the same first-`prefixLength` OR last-`suffixLength` hex chars (union-find over that
 * relation). Every address in a component of 2+ is flagged and carries that component's id.
 *
 * Identical addresses are deduped first (by normalized value), so the same Safe listed on several
 * chains never matches itself. Front/back are compared on the normalized hex (0x stripped); the
 * returned keys are the lowercased 0x-prefixed originals so callers can `has(addr.toLowerCase())`.
 */
export const detectListClusters = (
  addresses: string[],
  config: SimilarityConfig = DEFAULT_SIMILARITY_CONFIG,
): ListClusterResult => {
  const flagged = new Set<string>()
  const groupIdByAddress = new Map<string, string>()

  // Dedupe by normalized value, keeping the first lowercased original for the returned keys.
  const originalByNorm = new Map<string, string>()
  for (const address of addresses) {
    const normalized = normalizeAddress(address)
    if (!isUsableAddress(normalized) || originalByNorm.has(normalized)) continue
    originalByNorm.set(normalized, address.toLowerCase())
  }
  const uniques = [...originalByNorm.keys()]
  if (uniques.length < 2) return { flagged, groupIdByAddress }

  // Union-find over "shares prefix OR suffix".
  const parent = new Map<string, string>(uniques.map((u) => [u, u]))
  const find = (x: string): string => {
    let root = x
    while (parent.get(root) !== root) root = parent.get(root) as string
    let cur = x
    while (parent.get(cur) !== root) {
      const next = parent.get(cur) as string
      parent.set(cur, root)
      cur = next
    }
    return root
  }
  const union = (a: string, b: string): void => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  const firstByPrefix = new Map<string, string>()
  const firstBySuffix = new Map<string, string>()
  for (const norm of uniques) {
    const prefix = norm.slice(0, config.prefixLength)
    const suffix = norm.slice(-config.suffixLength)
    const prevP = firstByPrefix.get(prefix)
    if (prevP) union(norm, prevP)
    else firstByPrefix.set(prefix, norm)
    const prevS = firstBySuffix.get(suffix)
    if (prevS) union(norm, prevS)
    else firstBySuffix.set(suffix, norm)
  }

  // Keep only components with 2+ members; flag them and stamp the component id.
  const membersByRoot = new Map<string, string[]>()
  for (const norm of uniques) {
    const root = find(norm)
    const arr = membersByRoot.get(root)
    if (arr) arr.push(norm)
    else membersByRoot.set(root, [norm])
  }
  for (const [root, members] of membersByRoot) {
    if (members.length < 2) continue
    for (const norm of members) {
      const original = originalByNorm.get(norm) as string
      flagged.add(original)
      groupIdByAddress.set(original, root)
    }
  }

  return { flagged, groupIdByAddress }
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
export const detectListSimilarities = (addresses: string[], index: SimilarityIndex): Map<string, ListAnnotation> => {
  const annotations = new Map<string, ListAnnotation>()
  for (const address of addresses) {
    const match = index.isAnchor(address) ? undefined : (index.query(address) ?? undefined)
    annotations.set(address.toLowerCase(), { address, match })
  }
  return annotations
}
