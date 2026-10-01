import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export const GAS_PAYMENT_OPTIONS = ['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION', 'PAY_FROM_SAFE'] as const

export type GasPaymentOption = (typeof GAS_PAYMENT_OPTIONS)[number]

/** Known entries in canonical order; anything else is dropped. Also used for the 409 `available[]`. */
export const parseGasPaymentOptions = (value: unknown): GasPaymentOption[] => {
  if (!Array.isArray(value)) return []
  return GAS_PAYMENT_OPTIONS.filter((option) => value.includes(option))
}

export const getGasPaymentOptions = (chain: Pick<Chain, 'relayer'> | undefined): GasPaymentOption[] => {
  // The generated Relayer type lacks gasPaymentOptions until schema.json is regenerated
  const relayer = chain?.relayer as { gasPaymentOptions?: unknown } | null | undefined
  return parseGasPaymentOptions(relayer?.gasPaymentOptions)
}
