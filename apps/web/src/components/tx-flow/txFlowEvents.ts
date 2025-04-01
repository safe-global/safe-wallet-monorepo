import EventBus from '@/services/EventBus'
import { useEffect } from 'react'

export enum TxFlowEvent {
  NEXT = 'NEXT',
  PREV = 'PREV',
}

export interface TxFlowEvents {
  [TxFlowEvent.NEXT]: { step: number }
  [TxFlowEvent.PREV]: { step: number }
}

const txFlowEventBus = new EventBus<TxFlowEvents>()

export const txFlowDispatch = txFlowEventBus.dispatch.bind(txFlowEventBus)

export const txFlowSubscribe = txFlowEventBus.subscribe.bind(txFlowEventBus)

export const useOnEvent = <T extends TxFlowEvent>(event: T, callback: (arg: TxFlowEvents[T]) => void) => {
  useEffect(() => {
    const unsubFns = txFlowSubscribe(event, callback)

    return () => {
      unsubFns()
    }
  }, [event, callback])
}
