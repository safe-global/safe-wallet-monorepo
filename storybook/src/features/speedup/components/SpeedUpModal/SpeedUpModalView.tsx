import type { ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import RocketSpeedup from '@/public/images/common/ic-rocket-speedup.svg'

export type SpeedUpModalViewProps = {
  open: boolean
  safeTxHasSignatures: boolean
  isDisabled: boolean
  isWrongChain: boolean
  gasParams: ReactNode
  renderNetworkWarning: (action: string) => ReactNode
  onCancel: () => void
  onClose: () => void
  onSubmit: () => void
}

export const SpeedUpModalView = ({
  open,
  safeTxHasSignatures,
  isDisabled,
  isWrongChain,
  gasParams,
  renderNetworkWarning,
  onCancel,
  onClose,
  onSubmit,
}: SpeedUpModalViewProps) => {
  if (safeTxHasSignatures) {
    return (
      <ModalDialog open={open} onClose={onCancel} dialogTitle="Speed up transaction" forceBackdrop>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-center">
            <RocketSpeedup className="size-[90px]" />
          </div>

          <Typography data-testid="speedup-summary">
            This will speed up the pending transaction by{' '}
            <Typography as="span" variant="paragraph-bold" className="inline">
              replacing
            </Typography>{' '}
            the original gas parameters with new ones.
          </Typography>

          <div className="mt-4">{gasParams}</div>
          <div className="[&:not(:empty)]:mt-6">{renderNetworkWarning('speed up a transaction')}</div>
        </div>

        <div className="flex items-center justify-between gap-2 p-4 pb-6">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>

          <Button disabled={isDisabled || isWrongChain} onClick={onSubmit}>
            {isDisabled ? <Spinner className="size-5" /> : 'Confirm'}
          </Button>
        </div>
      </ModalDialog>
    )
  }

  return (
    <ModalDialog open={open} onClose={onClose} dialogTitle="Speed up transaction" forceBackdrop>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-center">
          <RocketSpeedup className="size-[90px]" />
        </div>

        <Typography data-testid="speedup-summary">
          Is this transaction taking too long? Speed it up by using the &quot;speed up&quot; option in your connected
          wallet.
        </Typography>
      </div>
    </ModalDialog>
  )
}
