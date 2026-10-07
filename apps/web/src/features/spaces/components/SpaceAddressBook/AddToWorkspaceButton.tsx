import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Plus } from 'lucide-react'
import InvalidContactNameTooltip from './InvalidContactNameTooltip'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { Spinner } from '@/components/ui/spinner'
import { useAddOrRequestWorkspaceContact } from '../../hooks/useAddOrRequestWorkspaceContact'
import { validateContactName } from './utils'

type AddToWorkspaceButtonProps = {
  address: string
  name: string
  chainIds: string[]
  isCompact?: boolean
}

const AddToWorkspaceButton = ({ address, name, chainIds, isCompact }: AddToWorkspaceButtonProps) => {
  const addOrRequestContact = useAddOrRequestWorkspaceContact()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [added, setAdded] = useState(false)

  const nameError = validateContactName(name)

  const handleAdd = async () => {
    if (added || nameError) return

    setIsSubmitting(true)
    try {
      if ((await addOrRequestContact({ address, name, chainIds })) !== 'added') return
      trackEvent(SPACE_EVENTS.LOCAL_CONTACT_ADDED, { [MixpanelEventParams.SOURCE]: 'local_contact_row' })
      setAdded(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const label = added ? 'Added' : 'Add to Workspace'
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
