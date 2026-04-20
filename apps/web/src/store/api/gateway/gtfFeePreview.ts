import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { OperationType } from '@safe-global/types-kit'

import { GATEWAY_URL } from '@/config/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'

export type FeePreviewTransactionDto = {
  to: string
  value: string
  data: string
  operation: OperationType
  gasToken: string
  numberSignatures: number
}

export type FeePreviewTxData = {
  chainId: number
  safeAddress: string
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: string
  numberSignatures: number
}

export type FeePreviewResponse = {
  txData: FeePreviewTxData
  relayCostUsd: number
  pricingContextSnapshot: {
    phase: number
    priceSource: string
    priceTimestamp: number
    gasVolatilityBuffer: number
  }
}

export type FeePreviewArg = {
  chainId: string
  safeAddress: string
  tx: FeePreviewTransactionDto
}

const isFeePreviewResponse = (value: unknown): value is FeePreviewResponse =>
  typeof value === 'object' &&
  value !== null &&
  'txData' in value &&
  'relayCostUsd' in value &&
  'pricingContextSnapshot' in value

export const gtfFeePreviewEndpoints = (builder: EndpointBuilder<any, 'Submissions', 'gatewayApi'>) => ({
  getGtfFeePreview: builder.query<FeePreviewResponse, FeePreviewArg>({
    async queryFn({ chainId, safeAddress, tx }) {
      try {
        const response = await fetch(`${GATEWAY_URL}/v1/chains/${chainId}/fees/${safeAddress}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx),
        })

        if (!response.ok) {
          return { error: new Error(`Fee preview failed with status ${response.status}`) }
        }

        const body: unknown = await response.json()
        if (!isFeePreviewResponse(body)) {
          return { error: new Error('Fee preview response did not match expected shape') }
        }
        return { data: body }
      } catch (error) {
        return { error: asError(error) }
      }
    },
  }),
})
