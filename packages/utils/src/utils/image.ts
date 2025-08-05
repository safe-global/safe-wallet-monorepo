const COINGECKO_THUMB = '/thumb/'
const COINGECKO_DOMAIN = 'coingecko.com'

type CoinGeckoImageQuality = 'small' | 'large'

export const upgradeCoinGeckoThumbToQuality = (
  logoUri?: string | null,
  quality: CoinGeckoImageQuality = 'small',
): string | undefined => {
  if (logoUri === null || logoUri === undefined) {
    return undefined
  }

  if (logoUri === '' || !logoUri.includes(COINGECKO_DOMAIN)) {
    return logoUri
  }

  return logoUri.replace(COINGECKO_THUMB, `/${quality}/`)
}
