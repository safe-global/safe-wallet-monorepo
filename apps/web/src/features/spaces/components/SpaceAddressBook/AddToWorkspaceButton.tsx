import { useState } from 'react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAddOrRequestWorkspaceContact } from '../../hooks/useAddOrRequestWorkspaceContact'
import { validateContactName } from './utils'
import { AddToWorkspaceButtonView } from '@views/features/spaces/components/SpaceAddressBook/AddToWorkspaceButtonView'

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

  return (
    <AddToWorkspaceButtonView
      added={added}
      isSubmitting={isSubmitting}
      nameError={nameError}
      isCompact={isCompact}
      onAdd={handleAdd}
    />
  )
}

export default AddToWorkspaceButton
