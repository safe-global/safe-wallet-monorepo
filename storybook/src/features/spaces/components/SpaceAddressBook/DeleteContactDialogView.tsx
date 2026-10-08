import type { ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type DeleteContactDialogViewProps = {
  name: string
  onClose: () => void
  onConfirm: () => void
  isDarkMode: boolean
  hasError: boolean
  isSubmitting: boolean
  chainList: ReactNode
}

export const DeleteContactDialogView = ({
  name,
  onClose,
  onConfirm,
  isDarkMode,
  hasError,
  isSubmitting,
  chainList,
}: DeleteContactDialogViewProps) => (
  <ModalDialog
    open
    onClose={onClose}
    dialogTitle="Remove address book entry"
    maxWidth="sm"
    fullWidth
    hideChainIndicator
  >
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="p-6">
        <Typography className="mb-2">
          Are you sure you want to remove <strong>{name}</strong> from the address book? This change will apply to the
          following networks:
        </Typography>

        {chainList}

        {hasError && (
          <Alert variant="destructive" className="mt-4">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>Something went wrong deleting the contact. Please try again.</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex justify-between gap-2 p-4 pt-0 pb-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button data-testid="delete-btn" onClick={onConfirm} variant="destructive" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="size-5" /> : 'Remove'}
        </Button>
      </div>
    </div>
  </ModalDialog>
)
