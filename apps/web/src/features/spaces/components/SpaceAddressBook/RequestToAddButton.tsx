import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  useAddressBooksCreateRequestV1Mutation,
  useAddressBooksUpsertPrivateItemsV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import { CircularProgress } from '@mui/material'

type RequestToAddButtonProps = {
  address: string
  name: string
  chainIds: string[]
  isLocal?: boolean
  alreadyRequested?: boolean
}

const RequestToAddButton = ({ address, name, chainIds, isLocal, alreadyRequested }: RequestToAddButtonProps) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [createRequest] = useAddressBooksCreateRequestV1Mutation()
  const [upsertPrivate] = useAddressBooksUpsertPrivateItemsV1Mutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)

  const isDone = alreadyRequested || requested

  const handleRequest = async () => {
    if (!spaceId || isDone) return

    try {
      setIsSubmitting(true)

      // Local contacts need to be uploaded as private first
      if (isLocal) {
        const uploadResult = await upsertPrivate({
          spaceId: Number(spaceId),
          upsertAddressBookItemsDto: { items: [{ name, address, chainIds }] },
        })
        if (uploadResult.error) {
          dispatch(
            showNotification({
              message: 'Failed to upload contact. Please try again.',
              variant: 'error',
              groupKey: 'request-to-add-error',
            }),
          )
          return
        }

        // Remove from local address book now that it's stored on the server
        for (const chainId of chainIds) {
          dispatch(removeAddressBookEntry({ chainId, address }))
        }
      }

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
