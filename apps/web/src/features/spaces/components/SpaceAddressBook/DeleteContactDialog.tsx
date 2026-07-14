import ModalDialog from '@/components/common/ModalDialog'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { ChainIndicatorList } from '@/features/multichain'
import { useAddressBooksDeleteByAddressV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

type DeleteContactDialogProps = {
  name: string
  address: string
  networks: string[]
  onClose: () => void
}

const DeleteContactDialog = ({ name, address, networks, onClose }: DeleteContactDialogProps) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()
  const [deleteEntry] = useAddressBooksDeleteByAddressV1Mutation()

  const handleConfirm = async () => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.REMOVE_ADDRESS_SUBMIT })
      const response = await deleteEntry({ spaceId: spaceId ?? '', address })

      if (response.error) {
        setError('Something went wrong deleting the contact. Please try again.')
        return
      }

      dispatch(
        showNotification({
          message: `Deleted contact`,
          variant: 'success',
          groupKey: 'delete-contact-success',
        }),
      )

      onClose()
    } catch (error) {
      setError('Something went wrong deleting the contact. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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

          <ChainIndicatorList chainIds={networks} />

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 pt-0">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button data-testid="delete-btn" onClick={handleConfirm} variant="destructive" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-5" /> : 'Remove'}
          </Button>
        </div>
      </div>
    </ModalDialog>
  )
}

export default DeleteContactDialog
