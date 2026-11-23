import { Alert, AlertAction, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpeedUpModal from '../SpeedUpModal'
import Rocket from '@/public/images/common/rocket.svg'
import type { MouseEventHandler, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { PendingProcessingTx } from '@/store/pendingTxsSlice'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'
import { trackEvent } from '@/services/analytics'
import useIsSpeedUpAvailable from '../../public/hooks/useIsSpeedUpAvailable'

type SpeedUpMonitorProps = {
  txId: string
  pendingTx: PendingProcessingTx
  /** `rowButton`: the Space queue table's 24px row action, with `hint` in its tooltip */
  modalTrigger: 'alertBox' | 'alertButton' | 'rowButton'
  hint?: ReactNode
  /** The caller already ran useIsSpeedUpAvailable: skips a second check of the signer */
  available?: boolean
  /** Called once this lazy component has loaded and rendered */
  onShow?: () => void
}

const SpeedUpMonitor = ({
  txId,
  pendingTx,
  modalTrigger = 'alertBox',
  hint,
  available,
  onShow,
}: SpeedUpMonitorProps) => {
  const [openSpeedUpModal, setOpenSpeedUpModal] = useState(false)
  const checked = useIsSpeedUpAvailable(available === undefined ? pendingTx : undefined)
  const isAvailable = available ?? checked

  useEffect(() => {
    if (isAvailable) onShow?.()
  }, [isAvailable, onShow])

  if (!isAvailable) {
    return null
  }

  const onOpen: MouseEventHandler = (e) => {
    e.stopPropagation()
    setOpenSpeedUpModal(true)
    trackEvent(MODALS_EVENTS.OPEN_SPEED_UP_MODAL)
  }

  return (
    <div>
      <SpeedUpModal
        open={openSpeedUpModal}
        handleClose={() => setOpenSpeedUpModal(false)}
        pendingTx={pendingTx}
        gasLimit={pendingTx.gasLimit}
        txId={txId}
        txHash={pendingTx.txHash!}
        signerAddress={pendingTx.signerAddress}
        signerNonce={pendingTx.signerNonce}
      />
      {modalTrigger === 'alertBox' ? (
        <Alert variant="warning" outlined={false}>
          <Rocket className="size-4" />
          <AlertTitle>
            <Typography align="left">Taking too long?</Typography>
          </AlertTitle>
          <AlertDescription>Try to speed up with better gas parameters.</AlertDescription>
          <AlertAction className="top-1/2">
            <Button variant="outline" className="text-foreground" onClick={onOpen}>{`Speed up >`}</Button>
          </AlertAction>
        </Alert>
      ) : modalTrigger === 'rowButton' ? (
        <Tooltip delay={150}>
          <TooltipTrigger
            render={
              <Button
                variant="default"
                size="2xs"
                className="w-20"
                aria-label={`Speed up #${pendingTx.nonce}`}
                onClick={onOpen}
              >
                Speed up
              </Button>
            }
          />
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        <Button variant="outline" size="sm" onClick={onOpen}>
          Speed up
        </Button>
      )}
    </div>
  )
}

export default SpeedUpMonitor
