import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUserAddressBookDeletePrivateItemV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { Spinner } from '@/components/ui/spinner'

type RemoveDuplicateButtonProps = {
  address: string
  chainIds: string[]
  isLocal?: boolean
  isPrivate?: boolean
}

const RemoveDuplicateButton = ({ address, chainIds, isLocal, isPrivate }: RemoveDuplicateButtonProps) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [deletePrivate] = useUserAddressBookDeletePrivateItemV1Mutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removed, setRemoved] = useState(false)

  const handleRemove = async () => {
    if (removed) return

    try {
      setIsSubmitting(true)

      if (isPrivate) {
        if (!spaceId) {
          throw new Error('Missing space id')
        }
        await deletePrivate({ spaceId: spaceId ?? '', address }).unwrap()
      }

      if (isLocal) {
        for (const chainId of chainIds) {
          dispatch(removeAddressBookEntry({ chainId, address }))
        }
      }

      setRemoved(true)
      dispatch(
        showNotification({ message: 'Duplicate contact removed', variant: 'success', groupKey: 'remove-dup-success' }),
      )
    } catch {
      dispatch(
        showNotification({ message: 'Failed to remove contact', variant: 'error', groupKey: 'remove-dup-error' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRemove} disabled={isSubmitting || removed}>
      {isSubmitting ? <Spinner className="size-3.5" /> : removed ? 'Removed' : 'Remove'}
    </Button>
  )
}

export default RemoveDuplicateButton
