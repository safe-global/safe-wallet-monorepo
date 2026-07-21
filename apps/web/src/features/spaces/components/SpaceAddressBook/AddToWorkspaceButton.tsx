import { useState } from 'react'
import { Button } from '@/components/ui/button'
import InvalidContactNameTooltip from './InvalidContactNameTooltip'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { Spinner } from '@/components/ui/spinner'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { validateContactName } from './utils'
import { sanitizeName } from '@safe-global/utils/validation/names'

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

  const nameError = validateContactName(name)

  const handleAdd = async () => {
    if (!spaceId || added || nameError) return

    try {
      setIsSubmitting(true)

      const result = await upsertAddressBook({
        spaceId: spaceId ?? '',
        upsertAddressBookItemsDto: { items: [{ name: sanitizeName(name), address, chainIds }] },
      })

      if (result.error) {
        dispatch(
          showNotification({
            message: getRtkQueryErrorMessage(result.error),
            variant: 'error',
            groupKey: 'add-to-workspace-error',
          }),
        )
        return
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

  const button = (
    <Button variant="outline" size="sm" onClick={handleAdd} disabled={isSubmitting || added || !!nameError}>
      {isSubmitting ? <Spinner className="size-3.5" /> : added ? 'Added' : 'Add to workspace'}
    </Button>
  )

  if (!nameError) {
    return button
  }

  return <InvalidContactNameTooltip nameError={nameError}>{button}</InvalidContactNameTooltip>
}

export default AddToWorkspaceButton
