/**
 * Builds a security report URL for Hypernative Guardian
 *
 * @param baseUrl - The base URL for the security report
 * @param chainId - The chain ID
 * @param safe - The Safe address
 * @param tx - The transaction hash
 * @returns The complete security report URL with query parameters
 */
export const buildSecurityReportUrl = (baseUrl: string, chainId: string, safe: string, tx: string): string => {
  const url = new URL(baseUrl)
  url.searchParams.set('chain', `evm:${chainId}`)
  url.searchParams.set('safe', safe)
  url.searchParams.set('tx', tx)
  url.searchParams.set('referrer', 'safe')
  return url.toString()
}
