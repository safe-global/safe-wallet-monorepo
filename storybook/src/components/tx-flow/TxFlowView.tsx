import type { ReactElement, ReactNode } from 'react'
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

export type TxFlowViewProps = {
  txFlow: ReactNode
  open: boolean
  onClose: () => void
  fullWidth: boolean
  isDiscardDialogOpen: boolean
  onDiscardDialogOpenChange: (nextOpen: boolean) => void
  onDiscard: () => void
}

export const TxFlowView = ({
  txFlow,
  open,
  onClose,
  fullWidth,
  isDiscardDialogOpen,
  onDiscardDialogOpenChange,
  onDiscard,
}: TxFlowViewProps): ReactElement => {
  return (
    <>
      <TxModalDialog open={open} onClose={onClose} fullWidth={fullWidth}>
        {txFlow}
      </TxModalDialog>

      <AlertDialog open={isDiscardDialogOpen} onOpenChange={onDiscardDialogOpenChange}>
        {/* The tx dialog is z-index 1300 below 900px, which would paint over AlertDialogContent's
            own z-50 — this is exactly the nested-overlay case that token exists for. */}
        <AlertDialogContent size="sm" className="z-[var(--z-nested-overlay)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this transaction?</AlertDialogTitle>
            <AlertDialogDescription>Closing this window will discard your current progress.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
