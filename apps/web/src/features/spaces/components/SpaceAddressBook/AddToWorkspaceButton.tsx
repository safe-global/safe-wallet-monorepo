import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'
import { Spinner } from '@/components/ui/spinner'

type AddToWorkspaceButtonProps = {
  address: string
  name: string
  chainIds: string[]
}

const AddToWorkspaceButton = ({ address, name, chainIds }: AddToWorkspaceButtonProps) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = async () => {
    if (!spaceId || added) return

    try {
      setIsSubmitting(true)

      const result = await upsertAddressBook({
        spaceId: spaceId ?? '',
        upsertAddressBookItemsDto: { items: [{ name, address, chainIds }] },
      })

      if (result.error) {
        dispatch(
          showNotification({ message: 'Failed to add contact', variant: 'error', groupKey: 'add-to-workspace-error' }),
        )
        return
      }

      // Remove from local address book
      for (const chainId of chainIds) {
        dispatch(removeAddressBookEntry({ chainId, address }))
      }

      setAdded(true)
      dispatch(
        showNotification({
          message: 'Contact added to workspace',
          variant: 'success',
          groupKey: 'add-to-workspace-success',
        }),
      )
    } catch {
      dispatch(
        showNotification({ message: 'Something went wrong', variant: 'error', groupKey: 'add-to-workspace-error' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleAdd} disabled={isSubmitting || added}>
      {isSubmitting ? <Spinner className="size-3.5" /> : added ? 'Added' : 'Add to workspace'}
    </Button>
  )
}

export default AddToWorkspaceButton
