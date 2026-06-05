import { Typography, Paper, Box, Stack } from '@mui/material'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import css from './styles.module.css'
import { useCurrentSpaceId } from '@/features/spaces'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'
import AcceptButton from './AcceptButton'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import DeclineButton from './DeclineButton'
import { useDarkMode } from '@/hooks/useDarkMode'
import Inviter from './Inviter'
import { getInvitedByName } from '@/features/spaces/utils'

const PreviewInvite = () => {
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const invitedByName = getInvitedByName(space, currentUser?.id)

  if (!space) return null

  return (
    <Paper sx={{ p: 2, mb: 4, backgroundColor: isDarkMode ? 'info.background' : 'info.light' }}>
      <Box className={css.previewInviteContent}>
        <InitialsAvatar name={space.name} size="medium" />
        <Stack direction="row" alignItems="center" flexWrap="wrap" rowGap={0.5} columnGap={0.5} flexGrow={1}>
          <Typography variant="body1" color="text.primary">
            You were invited to join
          </Typography>
          <Typography variant="body1" color="text.primary" fontWeight={700}>
            {space.name}
          </Typography>
          <Inviter invitedByName={invitedByName} variant="body1" avatarSize={20} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.preview_banner}>
            <AcceptButton space={space} />
          </Track>
          <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.preview_banner}>
            <DeclineButton space={space} />
          </Track>
        </Stack>
      </Box>
    </Paper>
  )
}

export default PreviewInvite
