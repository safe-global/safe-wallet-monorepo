import { Card, Box, Typography, Link as MUILink, Stack } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { OrgSummary } from '../OrgsCard'
import InitialsAvatar from '../InitialsAvatar'
import { useOrgSafeCount } from '@/features/organizations/hooks/useOrgSafeCount'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { ORG_EVENTS, ORG_LABELS } from '@/services/analytics/events/organizations'
import Track from '@/components/common/Track'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import { trackEvent } from '@/services/analytics'

type OrgListInvite = {
  org: GetOrganizationResponse
}

const OrgListInvite = ({ org }: OrgListInvite) => {
  const { id, name, userOrganizations: members } = org
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query()
  const numberOfAccounts = useOrgSafeCount(id)
  const numberOfMembers = members.length

  // @ts-ignore TODO: Need to fix the type once available
  const invitedBy = org.userOrganizations.find((member) => member.user.id === currentUser.id)?.invitedBy

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h4" fontWeight={700} mb={2} color="primary.light">
        You were invited to join{' '}
        <Typography component="span" variant="h4" fontWeight={700} color="primary.main">
          {name}
        </Typography>
        {invitedBy && (
          <>
            {' '}
            by
            <Typography
              component="span"
              variant="h4"
              fontWeight={700}
              color="primary.main"
              position="relative"
              top="4px"
              ml="6px"
              display="inline-block"
              sx={{ '> div': { gap: '4px' } }}
            >
              <EthHashInfo address={invitedBy} avatarSize={24} showName={false} showPrefix={false} />
            </Typography>
          </>
        )}
      </Typography>

      <Link href={{ pathname: AppRoutes.organizations.index, query: { orgId: id } }} passHref legacyBehavior>
        <MUILink
          underline="none"
          sx={{ display: 'block' }}
          onClick={() => trackEvent({ ...ORG_EVENTS.VIEW_INVITING_ORG })}
        >
          <Card sx={{ p: 2, backgroundColor: 'background.main', '&:hover': { backgroundColor: 'background.light' } }}>
            <Box className={css.orgsListInviteContent}>
              <Stack direction="row" spacing={2} alignItems="center" flexGrow={1}>
                <Box>
                  <InitialsAvatar name={name} size="large" />
                </Box>

                <Box>
                  <OrgSummary name={name} numberOfAccounts={numberOfAccounts} numberOfMembers={numberOfMembers} />
                </Box>
              </Stack>

              <Track {...ORG_EVENTS.ACCEPT_INVITE} label={ORG_LABELS.orgs_list_page}>
                <AcceptButton org={org} />
              </Track>
              <Track {...ORG_EVENTS.DECLINE_INVITE} label={ORG_LABELS.orgs_list_page}>
                <DeclineButton org={org} />
              </Track>
            </Box>
          </Card>
        </MUILink>
      </Link>
    </Card>
  )
}

export default OrgListInvite
