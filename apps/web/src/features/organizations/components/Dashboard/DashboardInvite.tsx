import { Card, Box, Stack, Button, Typography } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { InitialsAvatar, OrgSummary } from '../OrgsCard'
import { useUserOrganizationsDeclineInviteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useOrgSafeCount } from '@/features/organizations/hooks/useOrgSafeCount'
import { useState } from 'react'
import AcceptInviteDialog from '@/features/organizations/components/Dashboard/AcceptInviteDialog'

type OrgListInvite = {
  org: GetOrganizationResponse
}

const OrgListInvite = ({ org }: OrgListInvite) => {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [declineInvite] = useUserOrganizationsDeclineInviteV1Mutation()
  const { id, name, userOrganizations: members } = org
  const numberOfAccounts = useOrgSafeCount(id)
  const numberOfMembers = members.length

  const handleAcceptInvite = () => {
    setInviteOpen(true)
  }

  const handleDeclineInvite = () => {
    declineInvite({ orgId: org.id })
  }

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h4" fontWeight={700} mb={2} color="primary.light">
        You were invited to join{' '}
        <Typography component="span" variant="h4" fontWeight={700} color="primary.main">
          {name}
        </Typography>
      </Typography>

      <Card sx={{ p: 2, backgroundColor: 'background.main' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box>
            <InitialsAvatar orgName={name} size="large" />
          </Box>

          <Box flexGrow={1}>
            <OrgSummary name={name} numberOfAccounts={numberOfAccounts} numberOfMembers={numberOfMembers} />
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleAcceptInvite} size="small" sx={{ px: 2, py: 0.5 }}>
              Accept
            </Button>
            <Button variant="outlined" onClick={handleDeclineInvite} size="small" sx={{ px: 2, py: 0.5 }}>
              Decline
            </Button>
          </Stack>
        </Stack>
      </Card>
      {inviteOpen && <AcceptInviteDialog org={org} onClose={() => setInviteOpen(false)} />}
    </Card>
  )
}

export default OrgListInvite
