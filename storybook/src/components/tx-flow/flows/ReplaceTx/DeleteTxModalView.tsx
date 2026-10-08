import type { ReactElement, ReactNode } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { X as Close } from 'lucide-react'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorMessage from '@/components/tx/ErrorMessage'
import ExternalLink from '@/components/common/ExternalLink'

export type DeleteTxModalViewProps = {
  chainIndicator: ReactNode
  chainSwitcher: ReactNode
  error?: Error
  isLoading: boolean
  onClose: () => void
  onCancel: () => void
  onConfirm: () => void
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

export const DeleteTxModalView = ({
  chainIndicator,
  chainSwitcher,
  error,
  isLoading,
  onClose,
  onCancel,
  onConfirm,
  renderCheckWallet,
}: DeleteTxModalViewProps): ReactElement => {
  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogTitle render={<div />} className="p-4">
          <div data-testid="untrusted-token-warning" className="flex items-center">
            <Typography variant="paragraph-bold" className="flex items-center gap-2">
              <InfoIcon className="size-5 text-[var(--color-error-main)]" />
              Delete this transaction?
            </Typography>

            <div className="grow" />

            {chainIndicator}

            <Button aria-label="close" variant="ghost" size="icon-sm" onClick={onClose} className="ml-auto">
              <Close />
            </Button>
          </div>
        </DialogTitle>

        <Separator />

        <div className="p-6">
          <div>
            Are you sure you want to delete this transaction? This will permanently remove it from the queue but the
            already given signatures will remain valid.
          </div>

          <div className="mt-4">
            Make sure that you are aware of the{' '}
            <ExternalLink href="https://help.safe.global/articles/4016097317-Why-do-I-need-to-pay-for-cancelling-a-transaction?">
              potential risks
            </ExternalLink>{' '}
            related to deleting a transaction off-chain.
          </div>

          <div className="mt-4">{chainSwitcher}</div>

          {error && (
            <div className="mt-4">
              <ErrorMessage error={error}>Error deleting transaction</ErrorMessage>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between p-6">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Keep it
          </Button>

          {renderCheckWallet((isOk) => (
            <Button
              data-testid="delete-tx-btn"
              size="sm"
              onClick={onConfirm}
              disabled={!isOk || isLoading}
              className="min-h-9 min-w-[122px]"
            >
              {isLoading ? <Spinner className="size-5" /> : 'Yes, delete'}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
