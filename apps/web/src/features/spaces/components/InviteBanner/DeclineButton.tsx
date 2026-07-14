import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import DeclineInviteDialog from './DeclineInviteDialog'

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
    <>
      <Button variant="outline" size="sm" onClick={handleDeclineInvite} aria-label="Decline invitation">
        Decline
      </Button>
      {declineOpen && <DeclineInviteDialog space={space} onClose={handleCloseDeclineDialog} />}
    </>
  )
}

export default DeclineButton
