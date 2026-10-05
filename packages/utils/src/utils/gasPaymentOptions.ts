import type { Chain, Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export type GasPaymentOption = Relayer['gasPaymentOptions'][number]

export const GAS_PAYMENT_OPTIONS = [
  'NO_FEE_CAMPAIGN',
  'FREE_DAILY_LIMIT',
  'SUBSCRIPTION',
  'PAY_FROM_SAFE',
] as const satisfies readonly GasPaymentOption[]

/** Known entries in canonical order; anything else is dropped. */
export const parseGasPaymentOptions = (value: unknown): GasPaymentOption[] => {
  if (!Array.isArray(value)) return []
  return GAS_PAYMENT_OPTIONS.filter((option) => value.includes(option))
}

export const getGasPaymentOptions = (chain: Pick<Chain, 'relayer'> | undefined): GasPaymentOption[] =>
  parseGasPaymentOptions(chain?.relayer?.gasPaymentOptions)
