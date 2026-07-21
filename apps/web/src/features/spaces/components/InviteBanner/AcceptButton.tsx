import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import AcceptInviteDialog from './AcceptInviteDialog'

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
    <>
      <Button data-testid="accept-invite-button" size="sm" onClick={handleAcceptInvite} aria-label="Accept invitation">
        Accept
      </Button>
      {inviteOpen && <AcceptInviteDialog space={space} onClose={handleCloseInviteDialog} />}
    </>
  )
}

export default AcceptButton
