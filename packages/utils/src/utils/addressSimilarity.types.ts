/**
 * Type definitions for address similarity detection algorithm
 *
 * Used to detect potential address poisoning attacks by identifying
 * addresses that share similar prefixes and suffixes.
 *
 * NOTE: this file hosts TWO generations of types:
 *  - LEGACY (prefix+suffix AND bucketing, dead Hamming) — `SimilarityConfig`,
 *    `SimilarityGroup`, `SimilarityDetectionResult`, `DEFAULT_SIMILARITY_CONFIG`.
 *    Still consumed by web own-Safes lists and mobile Send. Marked @deprecated.
 *  - CURRENT (anchor-based, front-OR-back, two-tier severity) —
 *    `AnchorSimilarityConfig`, `SimilarityMatch`, `SimilarityIndex`,
 *    `ListAnnotation`, `DEFAULT_ANCHOR_SIMILARITY_CONFIG`. Prefer these.
 * See the migration checklist at the top of `addressSimilarity.ts`.
 */

import { Severity } from '../features/safe-shield/types'

/**
 * @deprecated Legacy config (prefix/suffix lengths + a no-op Hamming threshold).
 * Replaced by {@link AnchorSimilarityConfig}. Do not use in new code.
 */
export interface SimilarityConfig {
  /** Number of characters from the start (after 0x) to match. Default: 4 */
  prefixLength: number
  /** Number of characters from the end to match. Default: 4 */
  suffixLength: number
  /** Maximum Hamming distance in middle section to consider similar. Default: 10 */
  hammingThreshold: number
}

/**
 * @deprecated Legacy group shape. Replaced by {@link SimilarityMatch} /
 * {@link ListAnnotation}. Do not use in new code.
 */
export interface SimilarityGroup {
  /** The bucket key identifying this group (prefix + suffix) */
  bucketKey: string
  /** Addresses in this group that appear similar */
  addresses: string[]
}

/**
 * @deprecated Legacy detection result. Replaced by {@link SimilarityIndex}
 * (Mode A) and {@link ListAnnotation} (Mode B). Do not use in new code.
 */
export interface SimilarityDetectionResult {
  /** Groups of similar addresses detected */
  groups: SimilarityGroup[]
  /** Map of address → group bucket keys for quick lookup */
  addressToGroups: Map<string, string[]>
  /** Quick check: is a specific address flagged? */
  isFlagged: (address: string) => boolean
  /** Get the similarity group for an address */
  getGroup: (address: string) => SimilarityGroup | undefined
}

/**
 * @deprecated Legacy default config. Replaced by
 * {@link DEFAULT_ANCHOR_SIMILARITY_CONFIG}. Do not use in new code.
 */
export const DEFAULT_SIMILARITY_CONFIG: SimilarityConfig = {
  prefixLength: 4,
  suffixLength: 4,
  // High threshold to catch address poisoning attacks - middle section differences are expected
  // since attackers generate addresses matching prefix/suffix but can't control the middle
  hammingThreshold: 32,
}

// ────────────────────────────────────────────────────────────────────────────
// CURRENT engine — anchor-based, front-OR-back, two severity tiers.
// ────────────────────────────────────────────────────────────────────────────

/** Configuration for the anchor-based similarity engine. */
export interface AnchorSimilarityConfig {
  /** Min matching leading hex chars (after 0x) to flag. Default: 4 */
  prefixThreshold: number
  /** Min matching trailing hex chars to flag. Default: 4 */
  suffixThreshold: number
}

/** Default thresholds: a 4-char prefix or 4-char suffix match flags. */
export const DEFAULT_ANCHOR_SIMILARITY_CONFIG: AnchorSimilarityConfig = {
  prefixThreshold: 4,
  suffixThreshold: 4,
}

/**
 * A match between a candidate address and a trusted anchor it dangerously
 * resembles (but is not equal to).
 */
export interface SimilarityMatch {
  /** Normalized (no `0x`, lowercase) anchor address the candidate resembles. */
  anchor: string
  /** Longest common prefix length, L. */
  prefixLen: number
  /** Longest common suffix length, S. */
  suffixLen: number
  /** WARN = one end matches; CRITICAL = both visible ends match (eye-fooling). */
  severity: Severity
}

/**
 * A prebuilt index over the user's trusted anchors enabling cheap per-candidate
 * lookups. Build once (per anchor-set change), query many.
 */
export interface SimilarityIndex {
  /** True if the address is itself a trusted anchor (exact match). */
  isAnchor: (address: string) => boolean
  /** Strongest anchor the candidate resembles, or null if none / exact / invalid. */
  query: (address: string) => SimilarityMatch | null
  /** Number of distinct anchors indexed. */
  size: number
}

/** Per-list annotation (Mode B): an address plus its strongest anchor match, if any. */
export interface ListAnnotation {
  /** The address as supplied to the list. */
  address: string
  /** The anchor match, if this address resembles (but isn't) a trusted anchor. */
  match?: SimilarityMatch
}
