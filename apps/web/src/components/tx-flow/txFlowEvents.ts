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

/**
 * Hook that subscribes to a specific event and executes a callback when the event is triggered.
 * It uses the EventBus to manage the subscription and unsubscription of events.
 * @param event - The event to subscribe to.
 * @param callback - The callback function to execute when the event is triggered.
 */
export const useOnEvent = <T extends TxFlowEvent>(event: T, callback: (arg: TxFlowEvents[T]) => void) => {
  useEffect(() => {
    const unsubFns = txFlowSubscribe(event, callback)

    return () => {
      unsubFns()
    }
  }, [event, callback])
}
