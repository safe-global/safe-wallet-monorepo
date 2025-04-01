import { Card, Box, Typography, Link as MUILink, Stack } from '@mui/material'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SpaceSummary } from '../SpaceCard'
import { useSpaceSafeCount } from '@/features/spaces/hooks/useSpaceSafeCount'
import InitialsAvatar from '../InitialsAvatar'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import AcceptButton from './AcceptButton'
import DeclineButton from './DeclineButton'
import { trackEvent } from '@/services/analytics'

type SpaceListInvite = {
  space: GetSpaceResponse
}

const SpaceListInvite = ({ space }: SpaceListInvite) => {
  const { id, name, members } = space
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query()
  const numberOfAccounts = useSpaceSafeCount(id)
  const numberOfMembers = members.length

  const invitedBy = space.members.find((member) => member.user.id === currentUser?.id)?.invitedBy

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
              <EthHashInfo address={invitedBy} avatarSize={24} showName={false} showPrefix={false} copyPrefix={false} />
            </Typography>
          </>
        )}
      </Typography>

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
                  <SpaceSummary name={name} numberOfAccounts={numberOfAccounts} numberOfMembers={numberOfMembers} />
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
