import EventBus from '@/services/EventBus'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'

export enum SafeCreationEvent {
  AWAITING_EXECUTION = 'AWAITING_EXECUTION',
  PROCESSING = 'PROCESSING',
  RELAYING = 'RELAYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
  INDEXED = 'INDEXED',
}

export interface SafeCreationEvents {
  [SafeCreationEvent.AWAITING_EXECUTION]: {
    groupKey: string
    safeAddress: string
    networks: Chain[]
  }
  [SafeCreationEvent.PROCESSING]: {
    groupKey: string
    txHash: string
    safeAddress: string
  }
  [SafeCreationEvent.RELAYING]: {
    groupKey: string
    taskId: string
    safeAddress: string
  }
  [SafeCreationEvent.SUCCESS]: {
    groupKey: string
    safeAddress: string
    type: PayMethod
    chainId: string
  }
  [SafeCreationEvent.INDEXED]: {
    groupKey: string
    safeAddress: string
    chainId: string
  }
  [SafeCreationEvent.FAILED]: {
    groupKey: string
    error: Error
    safeAddress: string
  }
  [SafeCreationEvent.REVERTED]: {
    groupKey: string
    error: Error
    safeAddress: string
  }
}

const SafeCreationEventBus = new EventBus<SafeCreationEvents>()

export const safeCreationDispatch = SafeCreationEventBus.dispatch.bind(SafeCreationEventBus)

export const safeCreationSubscribe = SafeCreationEventBus.subscribe.bind(SafeCreationEventBus)

// Log all events
Object.values(SafeCreationEvent).forEach((event: SafeCreationEvent) => {
  safeCreationSubscribe<SafeCreationEvent>(event, (detail) => {
    console.info(`[Safe creation]: ${event}`, detail)
  })
})
