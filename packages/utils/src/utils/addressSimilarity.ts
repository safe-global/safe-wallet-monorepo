/**
 * Address Similarity Detection Service
 *
 * Detects potential address poisoning attacks by identifying addresses that
 * resemble addresses the user trusts (UIs show `0x1234…5678`, hiding the middle).
 *
 * ─── MIGRATION CHECKLIST ────────────────────────────────────────────────────
 * This module hosts TWO generations:
 *
 *   CURRENT (preferred) — anchor-based, front-OR-back, two-tier severity:
 *     normalizeAddress · longestCommonPrefixLen · longestCommonSuffixLen ·
 *     buildSimilarityIndex · detectListSimilarities
 *
 *   LEGACY (@deprecated — prefix+suffix AND bucketing + a no-op Hamming pass):
 *     detectSimilarAddresses · getFlaggedSimilarAddressSet · getBucketKey ·
 *     hammingDistance · getMiddleSection · DEFAULT_SIMILARITY_CONFIG (types)
 *
 *   Remaining LEGACY consumers to migrate before the legacy API can be deleted:
 *     web:    features/myAccounts/hooks/useSimilarAddressDetection.ts
 *             components/sidebar/NestedSafesList/useManageNestedSafes.ts
 *             components/common/TrustedSafesModal/useTrustedSafesModal.ts
 *             components/common/SpaceSafeBar/AccountsModal/useAccountsModalItems.ts
 *             features/spaces/components/SelectSafesOnboarding/hooks/useOnboardingSafes.ts
 *             features/spaces/components/AddAccounts/{index,SafesList}.tsx
 *             features/spaces/components/SafeAccounts/index.tsx
 *     mobile: features/Send/hooks/useSuspiciousAddressDetection.ts
 *             features/Send/components/SuspiciousAddressComparison.tsx
 *
 *   Deletion of the legacy API + its dead Hamming code is intentionally deferred
 *   to a later, cross-platform-verified PR (it is still imported by mobile).
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Severity } from '../features/safe-shield/types'
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
  const hex = address.toLowerCase().slice(2) // Remove '0x' prefix
  const prefix = hex.slice(0, prefixLength)
  const suffix = hex.slice(-suffixLength)
  return `${prefix}_${suffix}`
}

/**
 * Calculate Hamming distance between two strings (middle sections)
 * Returns the number of positions at which the corresponding characters differ
 */
export const hammingDistance = (str1: string, str2: string): number => {
  if (str1.length !== str2.length) {
    return Math.max(str1.length, str2.length)
  }

  let distance = 0
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] !== str2[i]) {
      distance++
    }
  }
  return distance
}

/**
 * Get the middle section of an address (between prefix and suffix)
 */
export const getMiddleSection = (address: string, prefixLength: number, suffixLength: number): string => {
  const hex = address.toLowerCase().slice(2) // Remove '0x' prefix
  return hex.slice(prefixLength, -suffixLength)
}

/**
 * Filter addresses in a bucket to only include those within Hamming threshold
 */
const filterByHammingDistance = (addresses: string[], config: SimilarityConfig): string[] => {
  if (addresses.length < 2) return []

  const result: Set<string> = new Set()

  for (let i = 0; i < addresses.length; i++) {
    for (let j = i + 1; j < addresses.length; j++) {
      const middle1 = getMiddleSection(addresses[i], config.prefixLength, config.suffixLength)
      const middle2 = getMiddleSection(addresses[j], config.prefixLength, config.suffixLength)
      const distance = hammingDistance(middle1, middle2)

      if (distance <= config.hammingThreshold) {
        result.add(addresses[i])
        result.add(addresses[j])
      }
    }
  }

  return Array.from(result)
}

/**
 * Detect addresses that are similar to each other
 *
 * Flags ALL addresses that share similar prefix+suffix patterns with other addresses.
 * This helps users identify potential address poisoning attacks where an attacker
 * creates addresses that look visually similar to legitimate ones.
 *
 * @deprecated Legacy intra-list detector (prefix+suffix AND, dead Hamming). Prefer the
 * anchor-based engine ({@link buildSimilarityIndex} / {@link detectListSimilarities}).
 * Kept only for existing own-Safes lists + mobile Send; see migration checklist above.
 *
 * @param addresses - All addresses to analyze
 * @param config - Configuration for similarity detection algorithm
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
    // Skip buckets with less than 2 addresses - no similarity issue
    if (addrs.length < 2) continue

    // Filter by Hamming distance threshold
    const similarAddresses = filterByHammingDistance(addrs, config)
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
 * Lowercase address set for every address that {@link detectSimilarAddresses} flags.
 * Dedupes case-insensitively; returns an empty set when there are fewer than two distinct addresses.
 *
 * @deprecated Legacy intra-list helper. Prefer the anchor-based engine
 * ({@link buildSimilarityIndex} / {@link detectListSimilarities}). Kept only for the
 * existing own-Safes lists; see migration checklist above.
 */
export const getFlaggedSimilarAddressSet = (addresses: string[]): Set<string> => {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]
  if (unique.length < 2) {
    return new Set()
  }
  const result = detectSimilarAddresses(unique)
  return new Set(unique.filter((addr) => result.isFlagged(addr)))
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT engine — anchor-based, front-OR-back, two severity tiers.
// Build the index once over the user's trusted anchors, then query each candidate.
// ─────────────────────────────────────────────────────────────────────────────

/** Strip a leading `0x` (any case) and lowercase. Pure & synchronous. */
export const normalizeAddress = (address: string): string => {
  const lower = address.trim().toLowerCase()
  return lower.startsWith('0x') ? lower.slice(2) : lower
}

/** True for an empty string or an all-zero (zero/burn) address. */
const isBlankOrZeroAddress = (normalized: string): boolean => normalized.length === 0 || /^0+$/.test(normalized)

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

/** Prefer CRITICAL over WARN; tie-break on more matched characters (L + S). */
const isStrongerMatch = (a: SimilarityMatch, b: SimilarityMatch): boolean => {
  const rank = (m: SimilarityMatch): number => (m.severity === Severity.CRITICAL ? 1 : 0)
  if (rank(a) !== rank(b)) return rank(a) > rank(b)
  return a.prefixLen + a.suffixLen > b.prefixLen + b.suffixLen
}

/**
 * Build an index over the user's trusted anchor addresses for cheap per-candidate
 * lookups. Anchors are normalized, deduped, and zero/burn addresses dropped.
 */
export const buildSimilarityIndex = (
  anchors: string[],
  config: AnchorSimilarityConfig = DEFAULT_ANCHOR_SIMILARITY_CONFIG,
): SimilarityIndex => {
  // Bucket on the shorter of the two thresholds so every OR-qualifying pair shares
  // at least one bucket: a prefix match (>= prefixThreshold >= keyLen) lands in the
  // same prefix bucket, a suffix match (>= suffixThreshold >= keyLen) in the same
  // suffix bucket. Thus the bucket lookup never misses a real match.
  const keyLen = Math.min(config.prefixThreshold, config.suffixThreshold)
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
    if (isBlankOrZeroAddress(normalized) || anchorSet.has(normalized)) continue
    anchorSet.add(normalized)
    pushTo(prefixBuckets, normalized.slice(0, keyLen), normalized)
    pushTo(suffixBuckets, normalized.slice(-keyLen), normalized)
  }

  const isAnchor = (address: string): boolean => anchorSet.has(normalizeAddress(address))

  const query = (address: string): SimilarityMatch | null => {
    const normalized = normalizeAddress(address)
    // Exact anchor (incl. cross-chain replica) is identity, not a lookalike.
    if (isBlankOrZeroAddress(normalized) || anchorSet.has(normalized)) return null

    const candidates = new Set<string>()
    for (const anchor of prefixBuckets.get(normalized.slice(0, keyLen)) ?? []) candidates.add(anchor)
    for (const anchor of suffixBuckets.get(normalized.slice(-keyLen)) ?? []) candidates.add(anchor)

    let best: SimilarityMatch | null = null
    for (const anchor of candidates) {
      const match = buildMatch(normalized, anchor, config)
      if (match && (best === null || isStrongerMatch(match, best))) best = match
    }
    return best
  }

  return { isAnchor, query, size: anchorSet.size }
}

/**
 * Annotate each address in a list with its strongest anchor match (Mode B).
 * An address that is itself an anchor is never marked (it is the trusted original).
 */
export const detectListSimilarities = (addresses: string[], index: SimilarityIndex): Map<string, ListAnnotation> => {
  const annotations = new Map<string, ListAnnotation>()
  for (const address of addresses) {
    const match = index.isAnchor(address) ? undefined : (index.query(address) ?? undefined)
    annotations.set(address, { address, match })
  }
  return annotations
}
