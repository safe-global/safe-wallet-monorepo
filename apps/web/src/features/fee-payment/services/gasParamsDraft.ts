import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { FLOAT_REGEX } from '@safe-global/utils/utils/validation'
import type { AdvancedParameters } from '@safe-global/views/components/tx/AdvancedParams/types'
import type { GasParamError } from '@safe-global/views/features/fee-payment/types'
import { BASE_TX_GAS } from '@/config/constants'

export type GasParamsDraft = {
  userNonce: string
  gasLimit: string
  maxPriorityFeePerGas: string
  maxFeePerGas: string
}

export type GasParamsDraftErrors = Partial<Record<keyof GasParamsDraft, GasParamError>>

const INTEGER_REGEX = /^\d+$/

const formatGwei = (value: bigint | null | undefined): string =>
  value === null || value === undefined ? '' : safeFormatUnits(value)

// The fee fields accept a comma as decimal separator, like the old Advanced parameters form did.
const parseGwei = (value: string): bigint | undefined =>
  value.trim() === '' ? undefined : safeParseUnits(value.trim().replace(',', '.'))

export const toGasParamsDraft = (params: AdvancedParameters): GasParamsDraft => ({
  userNonce: params.userNonce?.toString() ?? '',
  gasLimit: params.gasLimit?.toString() ?? '',
  maxPriorityFeePerGas: formatGwei(params.maxPriorityFeePerGas),
  maxFeePerGas: formatGwei(params.maxFeePerGas),
})

/** Only call on a draft without errors. */
export const fromGasParamsDraft = (draft: GasParamsDraft): AdvancedParameters => ({
  userNonce: Number(draft.userNonce),
  gasLimit: BigInt(draft.gasLimit.trim()),
  maxPriorityFeePerGas: parseGwei(draft.maxPriorityFeePerGas),
  maxFeePerGas: parseGwei(draft.maxFeePerGas),
})

const validateAmount = (value: string): GasParamError | undefined => {
  if (value.trim() === '') return 'REQUIRED'
  if (!FLOAT_REGEX.test(value.trim()) || parseGwei(value) === undefined) return 'INVALID_AMOUNT'
  return undefined
}

/** Without EIP-1559 there is no priority fee: `maxFeePerGas` holds the gas price. */
export const validateGasParamsDraft = (draft: GasParamsDraft, isEIP1559: boolean): GasParamsDraftErrors => {
  const errors: GasParamsDraftErrors = {}

  if (!INTEGER_REGEX.test(draft.userNonce.trim())) errors.userNonce = 'NOT_INTEGER'

  const gasLimit = draft.gasLimit.trim()
  if (gasLimit === '') errors.gasLimit = 'REQUIRED'
  else if (!INTEGER_REGEX.test(gasLimit)) errors.gasLimit = 'NOT_INTEGER'
  else if (BigInt(gasLimit) < BigInt(BASE_TX_GAS)) errors.gasLimit = 'BELOW_MIN_GAS_LIMIT'

  const maxFeeError = validateAmount(draft.maxFeePerGas)
  if (maxFeeError) errors.maxFeePerGas = maxFeeError

  if (isEIP1559) {
    const priorityFeeError = validateAmount(draft.maxPriorityFeePerGas)
    if (priorityFeeError) errors.maxPriorityFeePerGas = priorityFeeError
    else if (!maxFeeError && parseGwei(draft.maxPriorityFeePerGas)! > parseGwei(draft.maxFeePerGas)!)
      errors.maxFeePerGas = 'BELOW_PRIORITY_FEE'
  }

  return errors
}

export const isSameGasParamsDraft = (a: GasParamsDraft, b: GasParamsDraft): boolean =>
  a.userNonce === b.userNonce &&
  a.gasLimit === b.gasLimit &&
  a.maxPriorityFeePerGas === b.maxPriorityFeePerGas &&
  a.maxFeePerGas === b.maxFeePerGas
