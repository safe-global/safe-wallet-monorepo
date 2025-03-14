import { useState } from 'react'
import { Button, Box } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import AcceptInviteDialog from '@/features/organizations/components/InviteBanner/AcceptInviteDialog'
import DeclineInviteDialog from './DeclineInviteDialog'
import css from './styles.module.css'

type InviteButtonsProps = {
  org: GetOrganizationResponse
}

const InviteButtons = ({ org }: InviteButtonsProps) => {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  const handleAcceptInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setInviteOpen(true)
  }

  const handleDeclineInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDeclineOpen(true)
  }

  const handleCloseInviteDialog = () => {
    setInviteOpen(false)
  }

  const handleCloseDeclineDialog = () => {
    setDeclineOpen(false)
  }

  return (
    <>
      <Box className={css.inviteButtonContainer}>
        <Button
          className={css.inviteButton}
          variant="contained"
          onClick={handleAcceptInvite}
          aria-label="Accept invitation"
        >
          Accept
        </Button>
        <Button
          className={css.inviteButton}
          variant="outlined"
          onClick={handleDeclineInvite}
          aria-label="Decline invitation"
        >
          Decline
        </Button>
      </Box>
      {inviteOpen && <AcceptInviteDialog org={org} onClose={handleCloseInviteDialog} />}
      {declineOpen && <DeclineInviteDialog org={org} onClose={handleCloseDeclineDialog} />}
    </>
  )
}

export default InviteButtons
