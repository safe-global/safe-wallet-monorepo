import type { SafeVersion } from '@safe-global/types-kit'
import type { PredictedSafeProps } from '@safe-global/protocol-kit'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

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
  /**
   * Whether the currently authenticated user created this counterfactual safe.
   * Only creators can DELETE on the backend (others get 40x); consumers use this
   * to avoid pointless backend calls. Undefined is treated as `true` for
   * backwards compatibility with pre-backend-sync persisted state, which only
   * ever contained the user's own entries.
   */
  isCreator?: boolean
}
type UndeployedSafesSlice = { [address: string]: UndeployedSafe }
export type UndeployedSafesState = { [chainId: string]: UndeployedSafesSlice }

export type CreateSafeResult = {
  chain: Chain
  safeAddress: string
  success: boolean
  /** True when the Safe was already deployed on-chain, so it was navigated to
   *  but not persisted as counterfactual (no activation is pending). */
  alreadyDeployed?: boolean
}
