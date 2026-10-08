import { useState } from 'react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AcceptInviteDialog from './AcceptInviteDialog'
import { AcceptButtonView } from '@views/features/spaces/components/InviteBanner/AcceptButtonView'

type AcceptButtonProps = {
  space: GetSpaceResponse
}

const AcceptButton = ({ space }: AcceptButtonProps) => {
  const [inviteOpen, setInviteOpen] = useState(false)

  const handleAcceptInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setInviteOpen(true)
  }

  const handleCloseInviteDialog = () => {
    setInviteOpen(false)
  }

  return (
    <AcceptButtonView
      onClick={handleAcceptInvite}
      dialog={inviteOpen && <AcceptInviteDialog space={space} onClose={handleCloseInviteDialog} />}
    />
  )
}

export default AcceptButton
