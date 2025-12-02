import { createContext, type ReactElement, type ReactNode, useState, useCallback, useRef, useEffect } from 'react'
import TxModalDialog from '@/components/common/TxModalDialog'
import { SuccessScreenFlow, NestedTxSuccessScreenFlow } from './flows'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { usePreventNavigation } from '@/hooks/usePreventNavigation'
import { clearTxFlowState, loadTxFlowState } from './txFlowStorage'
import { loadFlowByType } from './flowRegistry'

const noop = () => {}

export type TxModalContextType = {
  txFlow: ReactElement | undefined
  setTxFlow: (txFlow: TxModalContextType['txFlow'], onClose?: () => void, shouldWarn?: boolean) => void
  setFullWidth: (fullWidth: boolean) => void
}

export const TxModalContext = createContext<TxModalContextType>({
  txFlow: undefined,
  setTxFlow: noop,
  setFullWidth: noop,
})

const confirmClose = () => {
  return confirm('Closing this window will discard your current progress.')
}

export const TxModalProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [txFlow, setFlow] = useState<TxModalContextType['txFlow']>(undefined)
  const [fullWidth, setFullWidth] = useState<boolean>(false)
  const shouldWarn = useRef<boolean>(true)
  const onClose = useRef<() => void>(noop)
  const { setSignerAddress } = useWalletContext() ?? {}
  const hasRestoredFlow = useRef<boolean>(false)

  const handleModalClose = useCallback(() => {
    if (shouldWarn.current && !confirmClose()) {
      return false
    }
    onClose.current()
    onClose.current = noop
    setFlow(undefined)

    setSignerAddress?.(undefined)

    // Clear saved tx flow state when modal closes
    clearTxFlowState()

    return true
  }, [setSignerAddress])

  // Open a new tx flow, close the previous one if any
  const setTxFlow = useCallback(
    (newTxFlow: TxModalContextType['txFlow'], newOnClose?: () => void, newShouldWarn?: boolean) => {
      setFlow((prev) => {
        if (prev === newTxFlow) return prev

        // If a new flow is triggered, close the current one
        if (prev && newTxFlow && newTxFlow.type !== SuccessScreenFlow && newTxFlow.type !== NestedTxSuccessScreenFlow) {
          if (shouldWarn.current && !confirmClose()) {
            return prev
          }
          onClose.current()
        }

        onClose.current = newOnClose ?? noop
        shouldWarn.current = newShouldWarn ?? true

        return newTxFlow
      })
    },
    [],
  )

  // Auto-restore saved flow on mount
  useEffect(() => {
    if (hasRestoredFlow.current) return

    const restoreFlow = async () => {
      const savedState = loadTxFlowState()
      if (!savedState) return

      hasRestoredFlow.current = true
      console.log('[TxModalProvider] Auto-restoring flow:', savedState.flowType)

      const FlowComponent = await loadFlowByType(savedState.flowType)
      if (!FlowComponent) {
        console.warn('[TxModalProvider] Failed to load flow, clearing saved state')
        clearTxFlowState()
        return
      }

      // Restore the flow - it will auto-restore to the saved step via TxFlow component
      setFlow(<FlowComponent />)
      shouldWarn.current = true
    }

    restoreFlow()
  }, [])

  usePreventNavigation(txFlow ? handleModalClose : undefined)

  return (
    <TxModalContext.Provider value={{ txFlow, setTxFlow, setFullWidth }}>
      {children}

      <TxModalDialog open={!!txFlow} onClose={handleModalClose} fullWidth={fullWidth}>
        {txFlow}
      </TxModalDialog>
    </TxModalContext.Provider>
  )
}
