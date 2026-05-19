import type { SafeVersion } from '@safe-global/types-kit'
import type { ReplayedSafeProps } from '../types'

/**
 * Flat DTO matching the backend counterfactual-safes API schema.
 * All fields from safeAccountConfig are top-level.
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
  fallbackHandler: string
  to: string
  data: string
  paymentToken?: string | null
  payment?: string | null
  paymentReceiver: string
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
        fallbackHandler: dto.fallbackHandler,
        to: dto.to,
        data: dto.data,
        paymentToken: dto.paymentToken ?? undefined,
        payment: dto.payment != null ? Number(dto.payment) : undefined,
        paymentReceiver: dto.paymentReceiver,
      },
    },
  }
}
