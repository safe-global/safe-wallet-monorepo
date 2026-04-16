import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAddressBooksCreateRequestV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { CircularProgress } from '@mui/material'

const RequestToAddButton = ({ address, alreadyRequested }: { address: string; alreadyRequested?: boolean }) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [createRequest] = useAddressBooksCreateRequestV1Mutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)

  const isDone = alreadyRequested || requested

  const handleRequest = async () => {
    if (!spaceId || isDone) return

    try {
      setIsSubmitting(true)
      const result = await createRequest({
        spaceId: Number(spaceId),
        createAddressBookRequestDto: { address },
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

      setRequested(true)
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
    <Button variant="outline" size="sm" onClick={handleRequest} disabled={isSubmitting || isDone}>
      {isSubmitting ? <CircularProgress size={14} /> : isDone ? 'Requested' : 'Request to add'}
    </Button>
  )
}

export default RequestToAddButton
