import { useEffect, type ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import DialogActions from '@/components/common/DialogActions'
import { useAppDispatch, useAppSelector } from '@/store'
import { STEP_UP_FAILED_MESSAGE } from '../../constants'
import { settleStepUp } from '../../services/stepUpSession'
import {
  selectStepUpStatus,
  stepUpFailed,
  stepUpPopupBlocked,
  stepUpPopupOpened,
  type StepUpStatus,
} from '../../store/stepUpSlice'
import { listenForStepUp, openStepUpPopup, startStepUp } from '../../utils/stepUp'

const CONTENT: Record<Exclude<StepUpStatus, 'idle'>, { description: string; confirmLabel: string }> = {
  prompt: {
    description: 'This action needs a recent check of your second factor. The verification opens in a new window.',
    confirmLabel: 'Verify',
  },
  waiting: {
    description: 'Complete the verification in the new window. This dialog closes when you finish.',
    confirmLabel: 'Open the window again',
  },
  blocked: {
    description: 'Your browser blocked the verification window. Allow pop-ups for this site and try again.',
    confirmLabel: 'Try again',
  },
  failed: {
    description: STEP_UP_FAILED_MESSAGE,
    confirmLabel: 'Try again',
  },
}

const StepUpDialog = (): ReactElement | null => {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectStepUpStatus)
  const isOpen = status !== 'idle'

  useEffect(() => {
    if (!isOpen) return

    return listenForStepUp((outcome) => {
      if (outcome === 'failed') {
        dispatch(stepUpFailed())
        return
      }
      settleStepUp(dispatch, outcome === 'elevated')
    })
  }, [isOpen, dispatch])

  if (!isOpen) return null

  const onVerify = () => {
    dispatch(openStepUpPopup() ? stepUpPopupOpened() : stepUpPopupBlocked())
  }

  const onCancel = () => settleStepUp(dispatch, false)

  const { description, confirmLabel } = CONTENT[status]

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent data-testid="step-up-dialog">
        <AlertDialogHeader>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="size-5" />
          </div>
          <AlertDialogTitle>Verify your identity</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {status === 'blocked' && (
          <Button variant="ghost" className="self-start" onClick={startStepUp}>
            Verify in this tab instead. You must then repeat the action.
          </Button>
        )}

        <AlertDialogFooter>
          <DialogActions
            onCancel={onCancel}
            confirmLabel={confirmLabel}
            onConfirm={onVerify}
            confirmTestId="step-up-verify-button"
            cancelTestId="step-up-cancel-button"
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default StepUpDialog
