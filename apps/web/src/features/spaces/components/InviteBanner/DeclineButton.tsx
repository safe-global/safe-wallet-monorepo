import { useState } from 'react'
import { Button } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import DeclineInviteDialog from './DeclineInviteDialog'
import css from './styles.module.css'

type DeclineButtonProps = {
  space: GetOrganizationResponse
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
      <Button
        className={css.inviteButton}
        variant="outlined"
        onClick={handleDeclineInvite}
        aria-label="Decline invitation"
      >
        Decline
      </Button>
      {declineOpen && <DeclineInviteDialog space={space} onClose={handleCloseDeclineDialog} />}
    </>
  )
}

export default DeclineButton
