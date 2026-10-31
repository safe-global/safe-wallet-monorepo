import EventBus from '../../../services/EventBus'
import { IS_DEV } from '@/config/constants'

export enum RecoveryEvent {
  PROCESSING_BY_SMART_CONTRACT_WALLET = 'PROCESSING_BY_SMART_CONTRACT_WALLET',
  PROCESSING = 'PROCESSING', // Submitted to the blockchain
  PROCESSED = 'PROCESSED', // Executed on the blockchain
  SUCCESS = 'SUCCESS', // Loaded from the blockchain
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
}

export enum RecoveryTxType {
  PROPOSAL = 'PROPOSAL',
  EXECUTION = 'EXECUTION',
  SKIP_EXPIRED = 'SKIP_EXPIRED',
}

export interface RecoveryEvents {
  [RecoveryEvent.PROCESSING_BY_SMART_CONTRACT_WALLET]: {
    moduleAddress: string
    txHash: string
    recoveryTxHash: string
    txType: RecoveryTxType
  }
  [RecoveryEvent.PROCESSING]: {
    moduleAddress: string
    txHash: string
    recoveryTxHash: string
    txType: RecoveryTxType
  }
  [RecoveryEvent.REVERTED]: {
    moduleAddress: string
    txHash: string
    recoveryTxHash: string
    error: Error
    txType: RecoveryTxType
  }
  [RecoveryEvent.PROCESSED]: {
    moduleAddress: string
    txHash: string
    recoveryTxHash: string
    txType: RecoveryTxType
  }
  [RecoveryEvent.FAILED]: {
    moduleAddress: string
    txHash?: string
    recoveryTxHash?: string
    error: Error
    txType: RecoveryTxType
  }
  [RecoveryEvent.SUCCESS]: {
    recoveryTxHash: string
    txType: RecoveryTxType
  }
}

const recoveryEventBus = new EventBus<RecoveryEvents>()

export const recoveryDispatch = recoveryEventBus.dispatch.bind(recoveryEventBus)

export const recoverySubscribe = recoveryEventBus.subscribe.bind(recoveryEventBus)

if (IS_DEV) {
  Object.values(RecoveryEvent).forEach((event: RecoveryEvent) => {
    recoverySubscribe<RecoveryEvent>(event, (detail) => {
      console.info(`Recovery ${event} event received`, detail)
    })
  })
}
