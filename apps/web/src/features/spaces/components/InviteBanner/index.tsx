import { Card, Box, Typography, Stack } from '@mui/material'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceSummary } from '../SpaceCard'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
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
  const isDarkMode = useDarkMode()
  const { name, safeCount, memberCount } = space

  return (
    <Card sx={{ p: 2, mb: 2, borderRadius: '24px' }} data-testid="space-invite-banner">
      <Box className={css.spacesListInviteContent} mb={2}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" rowGap={0.5} columnGap={0.5} flexGrow={1}>
          <Typography variant="body2">You were invited to join</Typography>
          <Typography variant="body2" fontWeight={600}>
            {name}
          </Typography>
          <Inviter invitedByName={invitedByName} variant="body2" avatarSize={24} />
        </Stack>

        <Stack direction="row" className={cn('shadcn-scope', isDarkMode && 'dark', css.inviteButtonContainer)}>
          <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.space_list_page}>
            <DeclineButton space={space} />
          </Track>
          <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.space_list_page}>
            <AcceptButton space={space} />
          </Track>
        </Stack>
      </Box>

      <Box sx={{ backgroundColor: 'background.main', borderRadius: '16px', px: 1, py: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <InitialsAvatar name={name} size="medium" rounded />

          <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={memberCount} isCompact />
        </Stack>
      </Box>
    </Card>
  )
}

export default SpaceListInvite
