import type { EndpointBuilder, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

export const GATEWAY_TAG_TYPES = ['Submissions', 'SafeOverviews', 'SpendingLimits'] as const

export type GatewayTagType = (typeof GATEWAY_TAG_TYPES)[number]

export type GatewayEndpointBuilder = EndpointBuilder<
  ReturnType<typeof fakeBaseQuery<Error>>,
  GatewayTagType,
  'gatewayApi'
>

/** Lowercased, so the checksummed and the lowercase address of a Safe name the same cache entry. */
export const makeSpendingLimitsTag = (chainId: string, safeAddress: string): string =>
  `${chainId}:${safeAddress.toLowerCase()}`
