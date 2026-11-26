import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Check, Plus } from 'lucide-react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAddOrRequestWorkspaceContact } from '../../hooks/useAddOrRequestWorkspaceContact'
import NameContactsDialog from '@safe-global/views/features/spaces/components/AddressBookV2/NameContactsDialog'
import useChains from '@/hooks/useChains'
import { toChainInfos } from '../../utils'
import { validateContactName } from './utils'

type AddToWorkspaceButtonProps = {
  address: string
  name: string
  chainIds: string[]
  isCompact?: boolean
}

const AddToWorkspaceButton = ({ address, name, chainIds, isCompact }: AddToWorkspaceButtonProps) => {
  const addOrRequestContact = useAddOrRequestWorkspaceContact()
  const { configs } = useChains()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [added, setAdded] = useState(false)
  const [open, setOpen] = useState(false)

  const handleAdd = async (addedName: string) => {
    if (added) return

    setIsSubmitting(true)
    try {
      if ((await addOrRequestContact({ address, name: addedName, chainIds })) !== 'added') return
      trackEvent(SPACE_EVENTS.LOCAL_CONTACT_ADDED, { [MixpanelEventParams.SOURCE]: 'local_contact_row' })
      setAdded(true)
      setOpen(false)
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
      onClick={() => setOpen(true)}
      disabled={added}
    >
      {isCompact ? icon : label}
    </Button>
  )

  return (
    <>
      {isCompact ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}

      {open && (
        <NameContactsDialog
          contacts={[{ address, chains: toChainInfos(chainIds, configs), suggestedName: name }]}
          validateName={validateContactName}
          onConfirm={([contact]) => handleAdd(contact.name)}
          onClose={() => setOpen(false)}
          isSubmitting={isSubmitting}
          description="Everyone in the Workspace will see this name. Leave it empty to keep your local name."
        />
      )}
    </>
  )
}

export default AddToWorkspaceButton
