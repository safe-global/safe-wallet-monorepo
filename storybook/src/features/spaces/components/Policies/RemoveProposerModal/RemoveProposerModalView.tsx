import type { ReactElement } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type RemoveProposerModalViewProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isRemoving: boolean
  error?: string
  isDarkMode: boolean
}

export const RemoveProposerModalView = ({
  open,
  onClose,
  onConfirm,
  isRemoving,
  error,
  isDarkMode,
}: RemoveProposerModalViewProps): ReactElement => (
  <ModalDialog
    open={open}
    onClose={onClose}
    dialogTitle="Remove this proposer?"
    hideChainIndicator
    maxWidth="sm"
    data-testid="remove-proposer-modal"
  >
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex flex-col gap-4 px-6 pt-6">
        <Typography variant="paragraph">
          Removing this proposer will permanently remove the address and it won&apos;t be able to suggest transactions
          anymore.
        </Typography>
        <Typography variant="paragraph">
          To complete this action, confirm it with a signature on your connected wallet.
        </Typography>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>

      <div className="flex flex-col-reverse gap-2 p-6 sm:flex-row">
        <Button
          variant="secondary"
          size="submit"
          className="sm:flex-1"
          onClick={onClose}
          disabled={isRemoving}
          data-testid="remove-proposer-cancel"
        >
          No, keep it
        </Button>
        <Button
          variant="destructive"
          size="submit"
          className="sm:flex-1"
          onClick={onConfirm}
          disabled={isRemoving}
          data-testid="remove-proposer-confirm"
        >
          {isRemoving ? <Spinner /> : 'Yes, delete'}
        </Button>
      </div>
    </div>
  </ModalDialog>
)
