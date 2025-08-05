import type { SafeVersion } from '@safe-global/types-kit'
import type { PredictedSafeProps } from '@safe-global/protocol-kit'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'

export enum PendingSafeStatus {
  AWAITING_EXECUTION = 'AWAITING_EXECUTION',
  PROCESSING = 'PROCESSING',
  RELAYING = 'RELAYING',
}

export type UndeployedSafeStatus = {
  status: PendingSafeStatus
  type: PayMethod
  txHash?: string
  taskId?: string
  startBlock?: number
  submittedAt?: number
  signerAddress?: string
  signerNonce?: number | null
}
export type ReplayedSafeProps = {
  factoryAddress: string
  masterCopy: string
  safeAccountConfig: {
    threshold: number
    owners: string[]
    fallbackHandler: string
    to: string
    data: string
    paymentToken?: string
    payment?: number
    paymentReceiver: string
  }
  saltNonce: string
  safeVersion: SafeVersion
}
export type UndeployedSafeProps = PredictedSafeProps | ReplayedSafeProps
export type UndeployedSafe = {
  status: UndeployedSafeStatus
  props: UndeployedSafeProps
}
type UndeployedSafesSlice = { [address: string]: UndeployedSafe }
export type UndeployedSafesState = { [chainId: string]: UndeployedSafesSlice }
