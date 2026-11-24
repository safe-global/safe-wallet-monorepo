import { useState } from 'react'
import {
  useAddressBookRequestsApproveRequestV1Mutation,
  useAddressBookRequestsRejectRequestV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isElevationRequiredError } from '@/features/oidc-auth/public/utils/elevation'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useCurrentSpaceId } from '../public/hooks/useCurrentSpaceId'

const getApproveErrorMessage = (error: unknown): string => {
  const err = error as { data?: { message?: string } }
  return typeof err?.data?.message === 'string' ? err.data.message : 'Failed to approve request'
}

/** Approve or reject a pending address book request, with the toasts both address book versions show. */
export const useAddressBookRequestActions = () => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [approveRequest] = useAddressBookRequestsApproveRequestV1Mutation()
  const [rejectRequest] = useAddressBookRequestsRejectRequestV1Mutation()
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  const approve = async (requestId: number) => {
    if (!spaceId) {
      return
    }
    setReviewingId(requestId)
    try {
      const result = await approveRequest({ spaceId, requestId })
      if (isElevationRequiredError(result.error)) {
        return
      }
      if (result.error) {
        dispatch(
          showNotification({
            message: getApproveErrorMessage(result.error),
            variant: 'error',
            groupKey: 'approve-error',
          }),
        )
        return
      }
      dispatch(
        showNotification({
          message: 'Contact added to Workspace address book',
          variant: 'success',
          groupKey: 'approve-success',
        }),
      )
    } catch {
      dispatch(showNotification({ message: 'Something went wrong', variant: 'error', groupKey: 'approve-error' }))
    } finally {
      setReviewingId(null)
    }
  }

  const reject = async (requestId: number) => {
    if (!spaceId) {
      return
    }
    setReviewingId(requestId)
    try {
      const result = await rejectRequest({ spaceId, requestId })
      if (result.error) {
        dispatch(showNotification({ message: 'Failed to reject request', variant: 'error', groupKey: 'reject-error' }))
        return
      }
      dispatch(showNotification({ message: 'Request rejected', variant: 'success', groupKey: 'reject-success' }))
    } catch {
      dispatch(showNotification({ message: 'Something went wrong', variant: 'error', groupKey: 'reject-error' }))
    } finally {
      setReviewingId(null)
    }
  }

  return { approve, reject, reviewingId }
}
