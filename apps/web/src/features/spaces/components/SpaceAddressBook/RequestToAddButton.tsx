import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCreateAddressBookRequestMutation } from '@safe-global/store/gateway/privateAddressBookApi'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { CircularProgress } from '@mui/material'

const RequestToAddButton = ({ address }: { address: string }) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [createRequest] = useCreateAddressBookRequestMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRequest = async () => {
    if (!spaceId) return

    try {
      setIsSubmitting(true)
      const result = await createRequest({
        spaceId: Number(spaceId),
        address,
      })

      if (result.error) {
        dispatch(
          showNotification({
            message: 'Failed to create request. Please try again.',
            variant: 'error',
            groupKey: 'request-to-add-error',
          }),
        )
        return
      }

      dispatch(
        showNotification({
          message: 'Request submitted for admin approval',
          variant: 'success',
          groupKey: 'request-to-add-success',
        }),
      )
    } catch {
      dispatch(
        showNotification({
          message: 'Something went wrong. Please try again.',
          variant: 'error',
          groupKey: 'request-to-add-error',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRequest} disabled={isSubmitting}>
      {isSubmitting ? <CircularProgress size={14} /> : 'Request to add'}
    </Button>
  )
}

export default RequestToAddButton
