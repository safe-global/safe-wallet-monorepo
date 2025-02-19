import { Card, Box, Stack, Button, Typography } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { OrgLogo, OrgSummary } from '../OrgsCard'

type OrgListInvite = {
  org: GetOrganizationResponse
}

const OrgListInvite = ({ org }: OrgListInvite) => {
  const { name, userOrganizations: members } = org
  const safes = [] // TODO: Replace with actual safes data when available
  const numberOfAccounts = safes.length
  const numberOfMembers = members.length

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
            <OrgLogo orgName={name} size="large" />
          </Box>

          <Box flexGrow={1}>
            <OrgSummary name={name} numberOfAccounts={numberOfAccounts} numberOfMembers={numberOfMembers} />
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => {}} size="small">
              Accept
            </Button>
            <Button variant="outlined" onClick={() => {}} size="small">
              Decline
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Card>
  )
}

export default OrgListInvite
