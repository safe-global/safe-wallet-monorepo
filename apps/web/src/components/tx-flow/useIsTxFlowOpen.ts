import { useContext, useEffect, useRef, type RefObject } from 'react'
import { TxModalContext } from '.'

/**
 * Whether a tx flow is on screen, as a ref so event subscribers can read it when an event
 * arrives instead of resubscribing every time a flow opens or closes.
 */
export const useIsTxFlowOpenRef = (): RefObject<boolean> => {
  const { txFlow } = useContext(TxModalContext)
  const isTxFlowOpen = useRef(false)

  // Written after commit, not during render: a render React throws away would otherwise leave
  // the ref claiming a flow is on screen when none is.
  useEffect(() => {
    isTxFlowOpen.current = !!txFlow
  }, [txFlow])

  return isTxFlowOpen
}
