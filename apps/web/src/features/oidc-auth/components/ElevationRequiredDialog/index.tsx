import { useState } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { useAppDispatch, useAppSelector } from '@/store'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { clearElevationRequired, selectIsElevationRequired } from '../../store'
import { useStepUp } from '../../hooks/useStepUp'
import { clearPendingStepUpAction } from '../../utils/stepUpReplay'

/**
 * Prompts for a second factor after CGW rejected a sensitive Workspace action
 * with `403 elevation_required`.
 *
 * Mounted globally, driven by `elevationSlice`, which the store listener sets
 * from the failing request — so every gated action shares this one prompt
 * instead of each call site growing its own step-up branch.
 *
 * Confirming leaves the app for the provider's hosted challenge and returns to
 * the current page with the session elevated, where `useStepUpCallback` completes
 * the action that was interrupted. Dismissing abandons it.
 */
const ElevationRequiredDialog = () => {
  const dispatch = useAppDispatch()
  const isElevationRequired = useAppSelector(selectIsElevationRequired)
  const { stepUpWithRedirect } = useStepUp()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const isDarkMode = useDarkMode()

  if (!isElevationRequired) {
    return null
  }

  const handleClose = () => {
    clearPendingStepUpAction()
    dispatch(clearElevationRequired())
  }

  const handleConfirm = () => {
    setIsRedirecting(true)
    stepUpWithRedirect()
  }

  return (
    <ModalDialog
      open
      onClose={handleClose}
      dialogTitle="Verify it's you"
      hideChainIndicator
      maxWidth="xs"
      data-testid="elevation-required-dialog"
    >
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="p-6">
          <Typography variant="paragraph">
            This action changes your workspace, so it needs a fresh two-factor code. You&apos;ll be asked for one, then
            brought back here to finish up.
          </Typography>
        </div>

        <DialogActions
          className="px-6 pb-6"
          onCancel={handleClose}
          cancelDisabled={isRedirecting}
          cancelTestId="elevation-cancel-btn"
          confirmLabel="Verify"
          confirmLoading={isRedirecting}
          onConfirm={handleConfirm}
          confirmTestId="elevation-verify-btn"
        />
      </div>
    </ModalDialog>
  )
}

export default ElevationRequiredDialog
