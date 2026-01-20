import { safeEncodeURI } from '@/utils/url'

describe('safeEncodeURI', () => {
  it('should handle URLs with already encoded parentheses', () => {
    const url = 'https://assets.coingecko.com/coins/images/33415/thumb/eurcv_%281%29.png?1701752017'
    const result = safeEncodeURI(url)
    // Should not double-encode %28 and %29
    expect(result).toBe('https://assets.coingecko.com/coins/images/33415/thumb/eurcv_(1).png?1701752017')
  })

  it('should handle URLs with spaces', () => {
    const url = 'https://example.com/image with spaces.png'
    const result = safeEncodeURI(url)
    expect(result).toBe('https://example.com/image%20with%20spaces.png')
  })

  it('should handle already encoded URLs', () => {
    const url = 'https://example.com/image%20with%20spaces.png'
    const result = safeEncodeURI(url)
    expect(result).toBe('https://example.com/image%20with%20spaces.png')
  })

  it('should handle clean URLs without encoding', () => {
    const url = 'https://example.com/image.png'
    const result = safeEncodeURI(url)
    expect(result).toBe('https://example.com/image.png')
  })

  it('should handle malformed URIs by encoding the original', () => {
    // A URL with invalid percent encoding
    const url = 'https://example.com/image%ZZ.png'
    const result = safeEncodeURI(url)
    // decodeURI will fail on %ZZ, so it should encode the original
    expect(result).toBe('https://example.com/image%25ZZ.png')
  })
})
