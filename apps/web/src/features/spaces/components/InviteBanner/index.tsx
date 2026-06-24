import { Card, Box, Typography, Stack } from '@mui/material'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceSummary } from '../SpaceCard'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import Inviter from './Inviter'

type SpaceListInvite = {
  space: GetSpaceResponse
  invitedByName: string | undefined
}

const SpaceListInvite = ({ space, invitedByName }: SpaceListInvite) => {
  const { name, safeCount, memberCount } = space

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

      <Card sx={{ p: 2, backgroundColor: 'background.main' }}>
        <Box className={css.spacesListInviteContent}>
          <Stack direction="row" spacing={2} alignItems="center" flexGrow={1}>
            <Box>
              <InitialsAvatar name={name} size="large" />
            </Box>

            <Box>
              <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={memberCount} />
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
    </Card>
  )
}

export default SpaceListInvite
