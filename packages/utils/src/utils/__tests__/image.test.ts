import { upgradeCoinGeckoThumbToQuality } from '../image'

describe('upgradeCoinGeckoThumbToQuality', () => {
  it('should replace CoinGecko thumbnail URLs with large versions', () => {
    const thumbnailUrl = 'https://coin-images.coingecko.com/coins/images/25244/thumb/Optimism.png'
    const expectedUrl = 'https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png'

    expect(upgradeCoinGeckoThumbToQuality(thumbnailUrl, 'large')).toBe(expectedUrl)
  })

  it('should replace CoinGecko thumbnail URLs with small versions', () => {
    const thumbnailUrl = 'https://coin-images.coingecko.com/coins/images/25244/thumb/Optimism.png'
    const expectedUrl = 'https://coin-images.coingecko.com/coins/images/25244/small/Optimism.png'

    expect(upgradeCoinGeckoThumbToQuality(thumbnailUrl, 'small')).toBe(expectedUrl)
  })

  it('should use small as default quality', () => {
    const thumbnailUrl = 'https://coin-images.coingecko.com/coins/images/25244/thumb/Optimism.png'
    const expectedUrl = 'https://coin-images.coingecko.com/coins/images/25244/small/Optimism.png'

    expect(upgradeCoinGeckoThumbToQuality(thumbnailUrl)).toBe(expectedUrl)
  })

  it('should return unchanged URL if it does not contain /thumb/', () => {
    const coingeckoUrl = 'https://coin-images.coingecko.com/coins/images/25244/small/Optimism.png'

    expect(upgradeCoinGeckoThumbToQuality(coingeckoUrl, 'large')).toBe(coingeckoUrl)
  })

  it('should return unchanged URL if it is not from coingecko.com', () => {
    const regularUrl = 'https://example.com/token-logo.png'

    expect(upgradeCoinGeckoThumbToQuality(regularUrl, 'large')).toBe(regularUrl)
  })

  it('should return unchanged URL for non-CoinGecko URLs with /thumb/', () => {
    const nonCoingeckoUrl = 'https://example.com/assets/thumb/token.png'

    expect(upgradeCoinGeckoThumbToQuality(nonCoingeckoUrl, 'large')).toBe(nonCoingeckoUrl)
  })

  it('should handle null input', () => {
    expect(upgradeCoinGeckoThumbToQuality(null, 'large')).toBeUndefined()
  })

  it('should handle undefined input', () => {
    expect(upgradeCoinGeckoThumbToQuality(undefined, 'large')).toBeUndefined()
  })

  it('should handle empty string', () => {
    expect(upgradeCoinGeckoThumbToQuality('', 'large')).toBe('')
  })
})
