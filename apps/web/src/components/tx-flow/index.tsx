import { createContext, type ReactElement, type ReactNode, useState, useCallback, useRef } from 'react'
import TxModalDialog from '@/components/common/TxModalDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SuccessScreenFlow, NestedTxSuccessScreenFlow } from './flows'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { usePreventNavigation } from '@/hooks/usePreventNavigation'
import { useTopbarElevation } from '@/hooks/useTopbarElevation'

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

export const TxModalProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [txFlow, setFlow] = useState<TxModalContextType['txFlow']>(undefined)
  const [fullWidth, setFullWidth] = useState<boolean>(false)
  const shouldWarn = useRef<boolean>(true)
  const onClose = useRef<() => void>(noop)
  const { setSignerAddress } = useWalletContext() ?? {}

  /* What to run if the user confirms the discard. Non-null is also what opens the dialog, so there
     is no separate `open` flag to keep in step. */
  const [pendingDiscard, setPendingDiscard] = useState<(() => void) | null>(null)

  /* Mirrors `txFlow` so `setTxFlow` can read the current flow without depending on it — the context
     hands `setTxFlow` to every consumer, so a changing identity would re-render all of them. */
  const flowRef = useRef<TxModalContextType['txFlow']>(undefined)
  flowRef.current = txFlow

  /**
   * Runs `action` now when there is no unsaved progress, otherwise parks it behind the discard
   * dialog. Returns whether it ran; `action` is told whether it was parked.
   */
  const requestDiscard = useCallback((action: (wasParked: boolean) => void): boolean => {
    if (!shouldWarn.current) {
      action(false)
      return true
    }
    setPendingDiscard(() => () => action(true))
    return false
  }, [])

  const closeFlow = useCallback(() => {
    onClose.current()
    onClose.current = noop
    setFlow(undefined)

    setSignerAddress?.(undefined)
  }, [setSignerAddress])

  const handleModalClose = useCallback(() => requestDiscard(closeFlow), [requestDiscard, closeFlow])

  const applyFlow = useCallback(
    (newTxFlow: TxModalContextType['txFlow'], newOnClose?: () => void, newShouldWarn?: boolean) => {
      onClose.current = newOnClose ?? noop
      shouldWarn.current = newShouldWarn ?? true
      setFlow(newTxFlow)
    },
    [],
  )

  // Open a new tx flow, close the previous one if any
  const setTxFlow = useCallback(
    (newTxFlow: TxModalContextType['txFlow'], newOnClose?: () => void, newShouldWarn?: boolean) => {
      const prev = flowRef.current
      if (prev === newTxFlow) return

      // A new flow replacing one in progress discards it — success screens are a continuation of the
      // flow that opened them, so they are exempt.
      const isSuperseding =
        !!prev && !!newTxFlow && newTxFlow.type !== SuccessScreenFlow && newTxFlow.type !== NestedTxSuccessScreenFlow

      if (isSuperseding) {
        requestDiscard(() => {
          onClose.current()
          applyFlow(newTxFlow, newOnClose, newShouldWarn)
        })
        return
      }

      applyFlow(newTxFlow, newOnClose, newShouldWarn)
    },
    [applyFlow, requestDiscard],
  )

  usePreventNavigation(
    txFlow
      ? (proceed) =>
          requestDiscard((wasParked) => {
            closeFlow()
            if (wasParked) proceed()
          })
      : undefined,
  )

  useTopbarElevation('tx-flow', !!txFlow)

  return (
    <TxModalContext.Provider value={{ txFlow, setTxFlow, setFullWidth }}>
      {children}

      <TxModalDialog open={!!txFlow} onClose={handleModalClose} fullWidth={fullWidth}>
        {txFlow}
      </TxModalDialog>

      <AlertDialog
        open={!!pendingDiscard}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDiscard(null)
        }}
      >
        {/* The tx dialog is z-index 1300 below 900px, which would paint over AlertDialogContent's
            own z-50 — this is exactly the nested-overlay case that token exists for. */}
        <AlertDialogContent size="sm" className="z-[var(--z-nested-overlay)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this transaction?</AlertDialogTitle>
            <AlertDialogDescription>Closing this window will discard your current progress.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const discard = pendingDiscard
                setPendingDiscard(null)
                discard?.()
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TxModalContext.Provider>
  )
}
