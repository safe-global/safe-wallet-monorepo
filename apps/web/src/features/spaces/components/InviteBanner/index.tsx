import { Card, Box, Typography, Link as MUILink, Stack } from '@mui/material'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceSummary } from '../SpaceCard'
import { MemberStatus } from '@/features/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import { trackEvent } from '@/services/analytics'
import Inviter from './Inviter'

type SpaceListInvite = {
  space: GetSpaceResponse
  invitedByName: string | undefined
}

const SpaceListInvite = ({ space, invitedByName }: SpaceListInvite) => {
  const { id, name, members, safeCount } = space
  const numberOfMembers = members.filter((member) => member.status === MemberStatus.ACTIVE).length

  return (
    <Card sx={{ p: 2, mb: 2 }} data-testid="space-invite-banner">
      <Stack direction="row" alignItems="center" flexWrap="wrap" rowGap={0.5} columnGap={0.5} mb={2}>
        <Typography variant="h4" fontWeight={700} color="primary.light">
          You were invited to join
        </Typography>
        <Typography variant="h4" fontWeight={700} color="primary.main">
          {name}
        </Typography>
        <Inviter invitedByName={invitedByName} variant="h4" avatarSize={24} />
      </Stack>

      <Link href={{ pathname: AppRoutes.spaces.index, query: { spaceId: id } }} passHref legacyBehavior>
        <MUILink
          underline="none"
          sx={{ display: 'block' }}
          onClick={() => trackEvent({ ...SPACE_EVENTS.VIEW_INVITING_SPACE })}
        >
          <Card sx={{ p: 2, backgroundColor: 'background.main', '&:hover': { backgroundColor: 'background.light' } }}>
            <Box className={css.spacesListInviteContent}>
              <Stack direction="row" spacing={2} alignItems="center" flexGrow={1}>
                <Box>
                  <InitialsAvatar name={name} size="large" />
                </Box>

                <Box>
                  <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={numberOfMembers} />
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.space_list_page}>
                  <AcceptButton space={space} />
                </Track>
                <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.space_list_page}>
                  <DeclineButton space={space} />
                </Track>
              </Stack>
            </Box>
          </Card>
        </MUILink>
      </Link>
    </Card>
  )
}

export default SpaceListInvite
