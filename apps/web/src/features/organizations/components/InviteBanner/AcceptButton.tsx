import { useState } from 'react'
import { Button } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import AcceptInviteDialog from './AcceptInviteDialog'
import css from './styles.module.css'

type AcceptButtonProps = {
  org: GetOrganizationResponse
}

const AcceptButton = ({ org }: AcceptButtonProps) => {
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
      <Button
        className={css.inviteButton}
        variant="contained"
        onClick={handleAcceptInvite}
        aria-label="Accept invitation"
      >
        Accept
      </Button>
      {inviteOpen && <AcceptInviteDialog org={org} onClose={handleCloseInviteDialog} />}
    </>
  )
}

export default AcceptButton
