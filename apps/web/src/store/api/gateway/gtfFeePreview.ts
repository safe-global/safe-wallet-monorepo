import type { fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { OperationType } from '@safe-global/types-kit'

import { GATEWAY_URL } from '@/config/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'

type GatewayEndpointBuilder = EndpointBuilder<
  ReturnType<typeof fakeBaseQuery<Error>>,
  'Submissions' | 'SafeOverviews',
  'gatewayApi'
>

// prettier-ignore
const SUPPORTED_FIAT_CODES = new Set(
  'USD AED ARS AUD BDT BHD BMD BRL CAD CHF CLP CNY CZK DKK EUR GBP GEL HKD HUF IDR ILS INR JPY KRW KWD LKR MMK MXN MYR NGN NOK NZD PHP PKR PLN RUB SAR SEK SGD THB TRY TWD UAH VEF VND ZAR BTC ETH'.split(' '),
)

/**
 * The CGW only accepts ISO 4217 fiat codes. The user's display currency may be
 * a non-fiat (e.g. ETH/BTC) — fall back to USD when unsupported.
 */
export const toSupportedFiatCode = (currency: string | undefined): string => {
  const upper = (currency ?? '').toUpperCase()
  return SUPPORTED_FIAT_CODES.has(upper) ? upper : 'USD'
}

export type FeePreviewTransactionDto = {
  to: string
  value: string
  data: string
  operation: OperationType
  gasToken: string
  numberSignatures: number
  fiatCode?: string
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

export type FeePreviewRelayCost = {
  fiatCode: string
  fiatValue: string
}

export type FeePreviewResponse = {
  txData: FeePreviewTxData
  relayCost: FeePreviewRelayCost
  pricingContextSnapshot: {
    phase: number
    priceSource: string
    priceTimestamp: number
    gasPriceVolatilityBuffer: number
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
  'relayCost' in value &&
  'pricingContextSnapshot' in value

export const gtfFeePreviewEndpoints = (builder: GatewayEndpointBuilder) => ({
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
