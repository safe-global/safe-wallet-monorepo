import { createContext, type ReactElement, type ReactNode, useState, useCallback, useRef } from 'react'
import TxModalDialog from '@/components/common/TxModalDialog'
import { SuccessScreenFlow, NestedTxSuccessScreenFlow } from './flows'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { usePreventNavigation } from '@/hooks/usePreventNavigation'

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

  const handleModalClose = useCallback(() => {
    if (shouldWarn.current && !confirmClose()) {
      return false
    }
    onClose.current()
    onClose.current = noop
    setFlow(undefined)

    setSignerAddress?.(undefined)

    return true
  }, [setSignerAddress])

  // Open a new tx flow, close the previous one if any
  const setTxFlow = useCallback(
    (newTxFlow: TxModalContextType['txFlow'], newOnClose?: () => void, newShouldWarn?: boolean) => {
      setFlow((prev) => {
        if (prev === newTxFlow) return prev

        // Check if switching to success screen
        const isToSuccessScreen = newTxFlow?.type === SuccessScreenFlow || newTxFlow?.type === NestedTxSuccessScreenFlow

        console.log('[TxModalProvider] setTxFlow:', {
          hasPrev: !!prev,
          hasNew: !!newTxFlow,
          newType: typeof newTxFlow?.type === 'function' ? newTxFlow.type.name : String(newTxFlow?.type),
          isToSuccessScreen,
          shouldWarn: shouldWarn.current,
        })

        // If a new flow is triggered, close the current one (but not when switching to success screen)
        if (prev && newTxFlow && !isToSuccessScreen) {
          if (shouldWarn.current && !confirmClose()) {
            return prev
          }
          onClose.current()
        }

        onClose.current = newOnClose ?? noop
        // Don't warn when switching to success screen or when explicitly disabled
        const isSuccessScreen = newTxFlow?.type === SuccessScreenFlow || newTxFlow?.type === NestedTxSuccessScreenFlow
        shouldWarn.current = newShouldWarn ?? (isSuccessScreen ? false : true)

        return newTxFlow
      })
    },
    [],
  )

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
