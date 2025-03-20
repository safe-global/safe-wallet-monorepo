import { Typography, Paper, Box } from '@mui/material'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { InitialsAvatar } from '../SpaceCard'
import css from './styles.module.css'
import { useCurrentSpaceId } from 'src/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'
import AcceptButton from './AcceptButton'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import DeclineButton from './DeclineButton'

const PreviewInvite = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const { currentData: space } = useOrganizationsGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })

  if (!space) return null

  return (
    <Paper sx={{ p: 2, mb: 4, backgroundColor: 'info.light' }}>
      <Box className={css.previewInviteContent}>
        <InitialsAvatar name={space.name} size="medium" />
        <Typography variant="body1" color="text.primary" flexGrow={1}>
          You were invited to join <strong>{space.name}</strong>
        </Typography>
        <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.preview_banner}>
          <AcceptButton space={space} />
        </Track>
        <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.preview_banner}>
          <DeclineButton space={space} />
        </Track>
      </Box>
    </Paper>
  )
}

export default PreviewInvite
