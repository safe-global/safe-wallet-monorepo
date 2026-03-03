/**
 * Type definitions for address similarity detection algorithm
 *
 * Used to detect potential address poisoning attacks by identifying
 * addresses that share similar prefixes and suffixes.
 */

/** Configuration for similarity detection algorithm */
export interface SimilarityConfig {
  /** Number of characters from the start (after 0x) to match. Default: 4 */
  prefixLength: number
  /** Number of characters from the end to match. Default: 4 */
  suffixLength: number
  /** Maximum Hamming distance in middle section to consider similar. Default: 10 */
  hammingThreshold: number
}

/** A group of addresses that share similar prefix+suffix patterns */
export interface SimilarityGroup {
  /** The bucket key identifying this group (prefix + suffix) */
  bucketKey: string
  /** Addresses in this group that appear similar */
  addresses: string[]
}

/** Result of similarity detection across a list of addresses */
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

/** Default configuration values */
export const DEFAULT_SIMILARITY_CONFIG: SimilarityConfig = {
  prefixLength: 4,
  suffixLength: 4,
  // High threshold to catch address poisoning attacks - middle section differences are expected
  // since attackers generate addresses matching prefix/suffix but can't control the middle
  hammingThreshold: 32,
}
