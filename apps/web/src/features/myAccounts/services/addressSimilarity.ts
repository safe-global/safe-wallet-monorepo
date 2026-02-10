/**
 * Address Similarity Detection Service
 *
 * Detects potential address poisoning attacks by identifying addresses that share
 * similar prefixes and suffixes. This is a common attack vector where attackers
 * create addresses that look similar to legitimate addresses.
 *
 * Algorithm:
 * 1. Normalize all addresses to lowercase
 * 2. Create buckets based on prefix+suffix pattern
 * 3. Flag buckets that contain both pinned and unpinned addresses
 * 4. Within flagged buckets, verify middle section similarity using Hamming distance
 */

import type { SimilarityConfig, SimilarityGroup, SimilarityDetectionResult } from './addressSimilarity.types'
import { DEFAULT_SIMILARITY_CONFIG } from './addressSimilarity.types'

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
