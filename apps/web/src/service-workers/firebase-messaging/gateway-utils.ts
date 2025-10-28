// Be careful what you import here as it will increase the service worker bundle size

import {
  type BalancesGetBalancesV1ApiArg,
  type BalancesGetBalancesV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/**
 * Gateway utility functions for service worker context
 * Service workers don't have access to the Redux store, so we use direct fetch calls
 * with RTK Query types for type safety
 */

// Base URL management for service worker context
let baseUrl: string | null = null

export const setBaseUrl = (url: string) => {
  baseUrl = url
}

const getBaseUrl = (): string => {
  if (!baseUrl) {
    throw new Error('baseUrl not set. Call setBaseUrl before using gateway utilities')
  }
  return baseUrl
}

/**
 * Fetches chains configuration using direct fetch
 * Service workers can't access Redux store, so we use plain HTTP calls
 *
 * @returns Promise with results array of Chain objects
 */
export const getChainsConfig = async (): Promise<{ results: Chain[] }> => {
  const url = `${getBaseUrl()}/v1/chains`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch chains: ${response.status}`)
  }

  const data = await response.json()
  return { results: data.results || [] }
}

/**
 * Fetches balances for a Safe address using direct fetch
 * Service workers can't access Redux store, so we use plain HTTP calls
 * Uses RTK Query types for type safety - matches balancesGetBalancesV1 endpoint
 *
 * @param args - Arguments matching BalancesGetBalancesV1ApiArg from RTK Query
 * @returns Promise with Balances data matching BalancesGetBalancesV1ApiResponse
 */
export const getBalances = async (
  args: Pick<BalancesGetBalancesV1ApiArg, 'chainId' | 'safeAddress' | 'fiatCode'>,
): Promise<BalancesGetBalancesV1ApiResponse> => {
  // Build URL matching RTK Query endpoint definition
  const url = `${getBaseUrl()}/v1/chains/${args.chainId}/safes/${args.safeAddress}/balances/${args.fiatCode}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch balances: ${response.status}`)
  }

  return response.json()
}
