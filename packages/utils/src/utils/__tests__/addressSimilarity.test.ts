import {
  detectSimilarAddresses,
  getBucketKey,
  getFlaggedSimilarAddressSet,
  hammingDistance,
  getMiddleSection,
  normalizeAddress,
  longestCommonPrefixLen,
  longestCommonSuffixLen,
  buildSimilarityIndex,
  detectListSimilarities,
} from '../addressSimilarity'
import { Severity } from '../../features/safe-shield/types'

describe('addressSimilarity', () => {
  describe('getBucketKey', () => {
    it('should extract correct prefix and suffix', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const key = getBucketKey(address, 6, 4)
      expect(key).toBe('123456_5678')
    })

    it('should handle uppercase addresses', () => {
      const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12'
      const key = getBucketKey(address, 6, 4)
      expect(key).toBe('abcdef_ef12')
    })
  })

  describe('hammingDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(hammingDistance('abcdef', 'abcdef')).toBe(0)
    })

    it('should count character differences', () => {
      expect(hammingDistance('abcdef', 'aXcdeX')).toBe(2)
    })

    it('should handle completely different strings', () => {
      expect(hammingDistance('aaaaaa', 'bbbbbb')).toBe(6)
    })

    it('should handle different length strings', () => {
      expect(hammingDistance('abc', 'abcdef')).toBe(6)
    })
  })

  describe('getMiddleSection', () => {
    it('should extract middle section correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const middle = getMiddleSection(address, 6, 4)
      // Total hex = 40 chars, prefix = 6, suffix = 4, middle = 30
      expect(middle).toBe('7890abcdef1234567890abcdef1234')
    })
  })

  describe('detectSimilarAddresses', () => {
    it('should detect addresses with same prefix and suffix', () => {
      const addresses = [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0x123456eeeeeeeeee1234567890abcdef12345678', // Same prefix/suffix
      ]

      const result = detectSimilarAddresses(addresses)

      // Both addresses should be flagged as similar to each other
      expect(result.isFlagged(addresses[0])).toBe(true)
      expect(result.isFlagged(addresses[1])).toBe(true)
      expect(result.groups.length).toBe(1)
      expect(result.groups[0].addresses).toContain(addresses[0].toLowerCase())
      expect(result.groups[0].addresses).toContain(addresses[1].toLowerCase())
    })

    it('should not flag addresses with different prefix', () => {
      const addresses = [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xffffff7890abcdef1234567890abcdef12345678', // Different prefix
      ]

      const result = detectSimilarAddresses(addresses)

      expect(result.isFlagged(addresses[0])).toBe(false)
      expect(result.isFlagged(addresses[1])).toBe(false)
      expect(result.groups.length).toBe(0)
    })

    it('should not flag addresses with different suffix', () => {
      const addresses = [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0x1234567890abcdef1234567890abcdefFFFFFFFF', // Different suffix
      ]

      const result = detectSimilarAddresses(addresses)

      expect(result.isFlagged(addresses[0])).toBe(false)
      expect(result.isFlagged(addresses[1])).toBe(false)
      expect(result.groups.length).toBe(0)
    })

    it('should not flag single addresses', () => {
      const addresses = ['0x1234567890abcdef1234567890abcdef12345678']

      const result = detectSimilarAddresses(addresses)

      expect(result.groups.length).toBe(0)
      expect(result.isFlagged(addresses[0])).toBe(false)
    })

    it('should handle case-insensitive comparison', () => {
      const addresses = ['0x1234567890ABCDEF1234567890ABCDEF12345678', '0x123456eeeeeeeeee1234567890abcdef12345678']

      const result = detectSimilarAddresses(addresses)

      expect(result.isFlagged(addresses[0])).toBe(true)
      expect(result.isFlagged(addresses[1])).toBe(true)
    })

    it('should exclude addresses beyond Hamming threshold', () => {
      const addresses = [
        '0x123456aaaaaaaaaaaaaaaaaaaaaaaa12345678',
        '0x123456bbbbbbbbbbbbbbbbbbbbbbbb12345678', // 26 char difference in middle, beyond default threshold of 10
      ]

      const result = detectSimilarAddresses(addresses, { prefixLength: 6, suffixLength: 8, hammingThreshold: 10 })

      expect(result.groups.length).toBe(0)
    })

    it('should return correct group info via getGroup', () => {
      const addresses = ['0x1234567890abcdef1234567890abcdef12345678', '0x123456eeeeeeeeee1234567890abcdef12345678']

      const result = detectSimilarAddresses(addresses)
      const group = result.getGroup(addresses[1])

      expect(group).toBeDefined()
      expect(group?.bucketKey).toBeDefined()
      expect(group?.addresses).toContain(addresses[1].toLowerCase())
    })

    it('should return undefined for non-flagged address via getGroup', () => {
      const addresses = ['0x1234567890abcdef1234567890abcdef12345678']

      const result = detectSimilarAddresses(addresses)
      const group = result.getGroup('0xffffffffffffffffffffffffffffffffffffffff')

      expect(group).toBeUndefined()
    })

    it('should handle empty input arrays', () => {
      const result = detectSimilarAddresses([])

      expect(result.groups.length).toBe(0)
      expect(result.isFlagged('0x1234567890abcdef1234567890abcdef12345678')).toBe(false)
    })

    it('should flag all addresses in a similarity group', () => {
      // Simulate address poisoning: attacker creates address similar to legitimate one
      // Both share same prefix (abcdef) and suffix (901234) - classic poisoning attack
      const legitimateAddress = '0xABCDEF1234567890123456789012345678901234'
      const maliciousAddress = '0xABCDEFaaaaaaaaaaaaaaaaaaaaaaaaaaaa901234'
      const addresses = [legitimateAddress, maliciousAddress]

      const result = detectSimilarAddresses(addresses)

      // Both should be flagged so user can identify the similarity
      expect(result.isFlagged(legitimateAddress)).toBe(true)
      expect(result.isFlagged(maliciousAddress)).toBe(true)
      expect(result.groups.length).toBe(1)
    })
  })

  describe('getFlaggedSimilarAddressSet', () => {
    it('returns empty set when there are fewer than two distinct addresses', () => {
      expect(getFlaggedSimilarAddressSet([])).toEqual(new Set())
      expect(getFlaggedSimilarAddressSet(['0x1234567890abcdef1234567890abcdef12345678'])).toEqual(new Set())
      const addr = '0x1234567890abcdef1234567890abcdef12345678'
      expect(getFlaggedSimilarAddressSet([addr, addr.toLowerCase()])).toEqual(new Set())
    })

    it('returns lowercase flagged addresses when a pair is similar', () => {
      const a = '0x1234567890abcdef1234567890abcdef12345678'
      const b = '0x123456eeeeeeeeee1234567890abcdef12345678'
      const set = getFlaggedSimilarAddressSet([a, b])
      expect(set.size).toBe(2)
      expect(set.has(a.toLowerCase())).toBe(true)
      expect(set.has(b.toLowerCase())).toBe(true)
    })

    it('returns empty set when addresses are not similar', () => {
      const addresses = ['0x1234567890abcdef1234567890abcdef12345678', '0xffffff7890abcdef1234567890abcdef12345678']
      expect(getFlaggedSimilarAddressSet(addresses)).toEqual(new Set())
    })
  })
})

describe('addressSimilarity (anchor engine)', () => {
  // Anchor the user trusts.
  const TRUSTED = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
  // first4=a1b2, last4=5678, first6=a1b2c3, last6=345678

  describe('normalizeAddress', () => {
    it('strips a leading 0x and lowercases', () => {
      expect(normalizeAddress('0xABCDef1234567890ABCDEF1234567890abcdef12')).toBe(
        'abcdef1234567890abcdef1234567890abcdef12',
      )
    })

    it('handles an address without 0x', () => {
      expect(normalizeAddress('A1B2c3')).toBe('a1b2c3')
    })
  })

  describe('longestCommonPrefixLen / longestCommonSuffixLen', () => {
    it('counts matching leading chars until first difference', () => {
      expect(longestCommonPrefixLen('abcdef', 'abcXef')).toBe(3)
      expect(longestCommonPrefixLen('abc', 'xyz')).toBe(0)
      expect(longestCommonPrefixLen('abc', 'abc')).toBe(3)
    })

    it('counts matching trailing chars until first difference', () => {
      expect(longestCommonSuffixLen('abcdef', 'Xbcdef')).toBe(5)
      expect(longestCommonSuffixLen('xxxxef', 'yyyyef')).toBe(2)
      expect(longestCommonSuffixLen('abc', 'xyz')).toBe(0)
    })
  })

  describe('buildSimilarityIndex + query (Mode A)', () => {
    it('does not flag an exact anchor (identity, not poisoning)', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      expect(idx.query(TRUSTED)).toBeNull()
    })

    it('flags a both-ends (4+4) lookalike as CRITICAL', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      const candidate = '0xa1b2ffffffffffffffffffffffffffffffff5678'
      const match = idx.query(candidate)
      expect(match).not.toBeNull()
      expect(match?.severity).toBe(Severity.CRITICAL)
      expect(match?.prefixLen).toBe(4)
      expect(match?.suffixLen).toBe(4)
      expect(match?.anchor).toBe(normalizeAddress(TRUSTED))
    })

    it('flags a prefix-only lookalike as WARN (the cheap grind the old AND rule missed)', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      const candidate = '0xa1b2c3ffffffffffffffffffffffffffffffabcd'
      const match = idx.query(candidate)
      expect(match).not.toBeNull()
      expect(match?.severity).toBe(Severity.WARN)
      expect(match?.prefixLen).toBe(6)
      expect(match?.suffixLen).toBe(0)
    })

    it('flags a suffix-only lookalike as WARN', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      const candidate = '0x9999ffffffffffffffffffffffffffffff345678'
      const match = idx.query(candidate)
      expect(match).not.toBeNull()
      expect(match?.severity).toBe(Severity.WARN)
      expect(match?.prefixLen).toBe(0)
      expect(match?.suffixLen).toBe(6)
    })

    it('does not flag an unrelated address', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      expect(idx.query('0x7f3e9a01bc4d2e8f00112233445566778899aabb')).toBeNull()
    })

    it('does not flag accidental 1-2 char overlaps', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      // shares only the first char and the last 2 chars
      expect(idx.query('0xaf00112233445566778899aabbccddeeff001278')).toBeNull()
    })

    it('returns the strongest match when a candidate resembles several anchors', () => {
      const candidate = '0x1111222233334444555566667777888899990000'
      const warnAnchor = '0x11112ffffffffffffffffffffffffffffffeeee' // prefix-only (WARN)
      const criticalAnchor = '0x1111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0000' // both ends (CRITICAL)
      const idx = buildSimilarityIndex([warnAnchor, criticalAnchor])
      const match = idx.query(candidate)
      expect(match?.severity).toBe(Severity.CRITICAL)
      expect(match?.anchor).toBe(normalizeAddress(criticalAnchor))
    })

    it('isAnchor is true for an indexed address (any case / 0x), false otherwise', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      expect(idx.isAnchor(TRUSTED.toUpperCase())).toBe(true)
      expect(idx.isAnchor(normalizeAddress(TRUSTED))).toBe(true)
      expect(idx.isAnchor('0x7f3e9a01bc4d2e8f00112233445566778899aabb')).toBe(false)
    })

    it('treats a cross-chain replica of an anchor as identity, not a lookalike', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      // same 20 bytes the user trusts, just queried again (e.g. another chain)
      expect(idx.query(TRUSTED)).toBeNull()
    })

    it('ignores the zero address as anchor and as candidate', () => {
      const zero = '0x0000000000000000000000000000000000000000'
      const idx = buildSimilarityIndex([TRUSTED, zero])
      expect(idx.size).toBe(1)
      expect(idx.query(zero)).toBeNull()
    })

    it('returns null and size 0 for an empty anchor set', () => {
      const idx = buildSimilarityIndex([])
      expect(idx.size).toBe(0)
      expect(idx.query(TRUSTED)).toBeNull()
    })

    it('dedupes anchors case-insensitively / with or without 0x', () => {
      const idx = buildSimilarityIndex([TRUSTED, TRUSTED.toUpperCase(), normalizeAddress(TRUSTED)])
      expect(idx.size).toBe(1)
    })
  })

  describe('detectListSimilarities (Mode B)', () => {
    it('annotates impostors against anchors and leaves anchors/unrelated unmarked', () => {
      const idx = buildSimilarityIndex([TRUSTED])
      const impostor = '0xa1b2ffffffffffffffffffffffffffffffff5678'
      const unrelated = '0x7f3e9a01bc4d2e8f00112233445566778899aabb'
      const result = detectListSimilarities([TRUSTED, impostor, unrelated], idx)

      expect(result.get(TRUSTED)?.match).toBeUndefined() // an anchor is never an impostor
      expect(result.get(impostor)?.match?.severity).toBe(Severity.CRITICAL)
      expect(result.get(unrelated)?.match).toBeUndefined()
    })
  })
})
