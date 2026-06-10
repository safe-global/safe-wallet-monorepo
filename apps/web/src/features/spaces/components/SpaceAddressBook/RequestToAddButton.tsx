import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  useAddressBookRequestsCreateRequestV1Mutation,
  useUserAddressBookUpsertPrivateItemsV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

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
  const [createRequest] = useAddressBookRequestsCreateRequestV1Mutation()
  const [upsertPrivate] = useUserAddressBookUpsertPrivateItemsV1Mutation()
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
          spaceId: spaceId ?? '',
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
        spaceId: spaceId ?? '',
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

  if (isDone) {
    return <Badge variant="secondary">Requested</Badge>
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRequest} disabled={isSubmitting}>
      {isSubmitting ? <Spinner className="size-3.5" /> : 'Request to add'}
    </Button>
  )
}

export default RequestToAddButton
