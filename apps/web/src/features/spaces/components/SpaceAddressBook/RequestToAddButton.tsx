import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Clock, Plus } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import {
  useAddOrRequestWorkspaceContact,
  type WorkspaceContactLocation,
} from '../../hooks/useAddOrRequestWorkspaceContact'
import NameContactsDialog from '@safe-global/views/features/spaces/components/AddressBookV2/NameContactsDialog'
import useChains from '@/hooks/useChains'
import { toChainInfos } from '../../utils'
import { validateContactName } from './utils'

type RequestToAddButtonProps = {
  address: string
  name: string
  chainIds: string[]
  alreadyRequested?: boolean
  isCompact?: boolean
  location?: WorkspaceContactLocation
}

const RequestToAddButton = ({
  address,
  name,
  chainIds,
  alreadyRequested,
  isCompact,
  location,
}: RequestToAddButtonProps) => {
  const addOrRequestContact = useAddOrRequestWorkspaceContact({ location })
  const { configs } = useChains()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [open, setOpen] = useState(false)

  const isDone = alreadyRequested || requested

  const handleConfirm = async (requestedName: string) => {
    if (isDone) return

    setIsSubmitting(true)
    try {
      const result = await addOrRequestContact({ address, name: requestedName, chainIds })
      if (result === 'requested' || result === 'pending') {
        setRequested(true)
        setOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return isCompact ? (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" aria-label="Requested" />}>
          <Clock className="text-muted-foreground size-4" />
        </TooltipTrigger>
        <TooltipContent>Requested</TooltipContent>
      </Tooltip>
    ) : (
      <Badge variant="secondary">Requested</Badge>
    )
  }

  // Compact has no room for the label, so it moves into the accessible name and a tooltip
  const button = (
    <Button
      variant="outline"
      size={isCompact ? 'icon-sm' : 'sm'}
      aria-label={isCompact ? 'Request to add' : undefined}
      onClick={() => setOpen(true)}
    >
      {isCompact ? <Plus className="size-4" /> : 'Request to add'}
    </Button>
  )

  return (
    <>
      {isCompact ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
          <TooltipContent>Request to add</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}

      {open && (
        <NameContactsDialog
          contacts={[{ address, chains: toChainInfos(chainIds, configs), suggestedName: name }]}
          validateName={validateContactName}
          onConfirm={([contact]) => handleConfirm(contact.name)}
          onClose={() => setOpen(false)}
          isSubmitting={isSubmitting}
          title="Request to add contact"
          description="An admin has to approve the request before the contact appears in the Workspace address book. Leave the name empty to keep it."
          confirmLabel="Request to add"
        />
      )}
    </>
  )
}

export default RequestToAddButton
