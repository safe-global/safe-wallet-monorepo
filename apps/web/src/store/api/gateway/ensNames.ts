import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { JsonRpcProvider } from 'ethers'

import { batchLookupAddresses } from '@/services/ens/batchLookup'
import { asError } from '@safe-global/utils/services/exceptions/utils'

type EnsNamesResult = Record<string, string | null>

/**
 * Module-level cache for the mainnet provider.
 * Lazily created on first use to keep ethers out of the main bundle.
 */
let mainnetProviderPromise: Promise<JsonRpcProvider> | null = null

function getMainnetProvider(): Promise<JsonRpcProvider> {
  if (!mainnetProviderPromise) {
    mainnetProviderPromise = (async () => {
      const { INFURA_TOKEN } = await import('@safe-global/utils/config/constants')
      const { JsonRpcProvider } = await import('ethers')
      return new JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_TOKEN}`, 1, {
        staticNetwork: true,
      })
    })()
  }
  return mainnetProviderPromise
}

export const ensNameEndpoints = (builder: EndpointBuilder<any, 'Submissions', 'gatewayApi'>) => ({
  getBatchEnsNames: builder.query<EnsNamesResult, string[]>({
    async queryFn(addresses) {
      if (addresses.length === 0) {
        return { data: {} }
      }

      try {
        const provider = await getMainnetProvider()
        const result = await batchLookupAddresses(provider, addresses)
        return { data: result }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
      }
    },
    // Cache for 1 hour — ENS names rarely change
    keepUnusedDataFor: 3600,
  }),
})
