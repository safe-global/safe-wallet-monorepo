/**
 * Type definitions for address similarity detection — see `addressSimilarity.ts`
 * for how the intra-list and anchor detectors work. Intra-list types come first,
 * anchor types below.
 */

import { Severity } from '../features/safe-shield/types'

/** Prefix/suffix lengths for the intra-list detector ({@link detectSimilarAddresses}). */
export interface SimilarityConfig {
  /** Number of characters from the start (after 0x) to match. Default: 4 */
  prefixLength: number
  /** Number of characters from the end to match. Default: 4 */
  suffixLength: number
}

/** A group of listed addresses that share a prefix+suffix bucket (intra-list detector). */
export interface SimilarityGroup {
  /** The bucket key identifying this group (prefix + suffix) */
  bucketKey: string
  /** Addresses in this group that appear similar */
  addresses: string[]
}

/** Result of the intra-list detector ({@link detectSimilarAddresses}). */
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

/** Default prefix/suffix lengths for the intra-list detector. */
export const DEFAULT_SIMILARITY_CONFIG: SimilarityConfig = {
  prefixLength: 4,
  suffixLength: 4,
}

// Anchor detector — front-OR-back match against a trusted anchor, two severity tiers.

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
