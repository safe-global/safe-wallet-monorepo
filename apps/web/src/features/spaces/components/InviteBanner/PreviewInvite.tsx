import { Typography, Paper, Box, Stack } from '@mui/material'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '../InitialsAvatar'
import css from './styles.module.css'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'
import AcceptButton from './AcceptButton'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import DeclineButton from './DeclineButton'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useDarkMode } from '@/hooks/useDarkMode'

const PreviewInvite = () => {
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query()
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const invitedBy = space?.members.find((member) => member.user.id === currentUser?.id)?.invitedBy

  if (!space) return null

  return (
    <Paper sx={{ p: 2, mb: 4, backgroundColor: isDarkMode ? 'info.background' : 'info.light' }}>
      <Box className={css.previewInviteContent}>
        <InitialsAvatar name={space.name} size="medium" />
        <Typography variant="body1" color="text.primary" flexGrow={1}>
          You were invited to join <strong>{space.name}</strong>
          {invitedBy && (
            <>
              {' '}
              by
              <Typography
                component="span"
                variant="body1"
                fontWeight={700}
                color="primary.main"
                position="relative"
                top="4px"
                ml="6px"
                display="inline-block"
                sx={{ '> div': { gap: '4px' } }}
              >
                <EthHashInfo
                  address={invitedBy}
                  avatarSize={20}
                  showName={false}
                  showPrefix={false}
                  copyPrefix={false}
                />
              </Typography>
            </>
          )}
        </Typography>
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
