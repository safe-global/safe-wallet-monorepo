import { useState } from 'react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import DeclineInviteDialog from './DeclineInviteDialog'
import { DeclineButtonView } from '@views/features/spaces/components/InviteBanner/DeclineButtonView'

type DeclineButtonProps = {
  space: GetSpaceResponse
}

const DeclineButton = ({ space }: DeclineButtonProps) => {
  const [declineOpen, setDeclineOpen] = useState(false)

  const handleDeclineInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDeclineOpen(true)
  }

  const handleCloseDeclineDialog = () => {
    setDeclineOpen(false)
  }

  return (
    <DeclineButtonView
      onClick={handleDeclineInvite}
      dialog={declineOpen && <DeclineInviteDialog space={space} onClose={handleCloseDeclineDialog} />}
    />
  )
}

export default DeclineButton
