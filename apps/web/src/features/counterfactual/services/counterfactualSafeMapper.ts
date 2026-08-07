import type { SafeVersion } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { ReplayedSafeProps } from '../types'

/**
 * Flat DTO matching the backend counterfactual-safes API schema. Nullable
 * fields mirror the CGW OpenAPI schema (CounterfactualSafeDto +
 * GetCounterfactualSafeItem). `fromBackendDto` normalizes nullable address
 * fields to ZERO_ADDRESS so downstream FE code can rely on string values.
 */
export type BackendCfSafeDto = {
  chainId: string
  address: string
  factoryAddress: string
  masterCopy: string
  saltNonce: string
  safeVersion: string
  threshold: number
  owners: string[]
  fallbackHandler?: string | null
  to?: string | null
  data: string
  paymentToken?: string | null
  payment?: string | null
  paymentReceiver?: string | null
}

export const toBackendDto = (chainId: string, address: string, props: ReplayedSafeProps): BackendCfSafeDto => {
  const { safeAccountConfig } = props

  const dto: BackendCfSafeDto = {
    chainId,
    address,
    factoryAddress: props.factoryAddress,
    masterCopy: props.masterCopy,
    saltNonce: props.saltNonce,
    safeVersion: props.safeVersion,
    threshold: Number(safeAccountConfig.threshold),
    owners: safeAccountConfig.owners,
    fallbackHandler: safeAccountConfig.fallbackHandler,
    to: safeAccountConfig.to,
    data: safeAccountConfig.data,
    paymentReceiver: safeAccountConfig.paymentReceiver,
  }

  if (safeAccountConfig.paymentToken) {
    dto.paymentToken = safeAccountConfig.paymentToken
  }
  if (safeAccountConfig.payment != null) {
    dto.payment = String(safeAccountConfig.payment)
  }

  return dto
}

/**
 * Convert a flat backend DTO back to the nested ReplayedSafeProps format.
 */
export const fromBackendDto = (
  dto: BackendCfSafeDto,
): { chainId: string; address: string; props: ReplayedSafeProps } => {
  return {
    chainId: dto.chainId,
    address: dto.address,
    props: {
      factoryAddress: dto.factoryAddress,
      masterCopy: dto.masterCopy,
      saltNonce: dto.saltNonce,
      safeVersion: dto.safeVersion as SafeVersion,
      safeAccountConfig: {
        threshold: dto.threshold,
        owners: dto.owners,
        fallbackHandler: dto.fallbackHandler ?? ZERO_ADDRESS,
        to: dto.to ?? ZERO_ADDRESS,
        data: dto.data,
        paymentToken: dto.paymentToken ?? undefined,
        payment: dto.payment != null ? Number(dto.payment) : undefined,
        paymentReceiver: dto.paymentReceiver ?? ZERO_ADDRESS,
      },
    },
  }
}
