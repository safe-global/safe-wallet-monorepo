import { useContext, useRef, type RefObject } from 'react'
import { TxModalContext } from '.'

/**
 * Whether a tx flow is on screen, as a ref so event subscribers can read it when an event
 * arrives instead of resubscribing every time a flow opens or closes.
 */
export const useIsTxFlowOpenRef = (): RefObject<boolean> => {
  const { txFlow } = useContext(TxModalContext)
  const isTxFlowOpen = useRef(false)
  isTxFlowOpen.current = !!txFlow

  return isTxFlowOpen
}
