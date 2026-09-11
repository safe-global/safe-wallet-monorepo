import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Plus } from 'lucide-react'
import InvalidContactNameTooltip from './InvalidContactNameTooltip'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
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
  isCompact?: boolean
}

const AddToWorkspaceButton = ({ address, name, chainIds, isCompact }: AddToWorkspaceButtonProps) => {
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

      trackEvent(SPACE_EVENTS.LOCAL_CONTACT_ADDED, { [MixpanelEventParams.SOURCE]: 'local_contact_row' })
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

  const label = added ? 'Added' : 'Add to workspace'
  const icon = added ? <Check className="size-4" /> : <Plus className="size-4" />

  // Compact has no room for the label, so it moves into the accessible name and a tooltip
  const button = (
    <Button
      variant="outline"
      size={isCompact ? 'icon-sm' : 'sm'}
      aria-label={isCompact ? label : undefined}
      onClick={handleAdd}
      disabled={isSubmitting || added || !!nameError}
    >
      {isSubmitting ? <Spinner className="size-3.5" /> : isCompact ? icon : label}
    </Button>
  )

  if (nameError) {
    return <InvalidContactNameTooltip nameError={nameError}>{button}</InvalidContactNameTooltip>
  }

  if (!isCompact) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export default AddToWorkspaceButton
