import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { Spinner } from '@/components/ui/spinner'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { ALLOWED_NAME_REGEX } from '@safe-global/utils/validation/names'

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

  const hasInvalidChars = !ALLOWED_NAME_REGEX.test(name)

  const button = (
    <Button variant="outline" size="sm" onClick={handleAdd} disabled={isSubmitting || added || hasInvalidChars}>
      {isSubmitting ? <Spinner className="size-3.5" /> : added ? 'Added' : 'Add to workspace'}
    </Button>
  )

  if (hasInvalidChars) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{button}</TooltipTrigger>
        <TooltipContent>
          This contact contains invalid characters. Edit the contact before adding it to a workspace.
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export default AddToWorkspaceButton
