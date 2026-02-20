import { detectSimilarAddresses, getBucketKey, hammingDistance, getMiddleSection } from './addressSimilarity'

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
})
