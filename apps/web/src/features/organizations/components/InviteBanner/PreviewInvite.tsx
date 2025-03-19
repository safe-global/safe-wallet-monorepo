import { Typography, Paper, Box } from '@mui/material'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import InitialsAvatar from '../InitialsAvatar'
import css from './styles.module.css'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'
import AcceptButton from './AcceptButton'
import { ORG_LABELS } from '@/services/analytics/events/organizations'
import Track from '@/components/common/Track'
import { ORG_EVENTS } from '@/services/analytics/events/organizations'
import DeclineButton from './DeclineButton'

const PreviewInvite = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const orgId = useCurrentOrgId()
  const { currentData: org } = useOrganizationsGetOneV1Query({ id: Number(orgId) }, { skip: !isUserSignedIn })

  if (!org) return null

  return (
    <Paper sx={{ p: 2, mb: 4, backgroundColor: 'info.light' }}>
      <Box className={css.previewInviteContent}>
        <InitialsAvatar name={org.name} size="medium" />
        <Typography variant="body1" color="text.primary" flexGrow={1}>
          You were invited to join <strong>{org.name}</strong>
        </Typography>
        <Track {...ORG_EVENTS.ACCEPT_INVITE} label={ORG_LABELS.preview_banner}>
          <AcceptButton org={org} />
        </Track>
        <Track {...ORG_EVENTS.DECLINE_INVITE} label={ORG_LABELS.preview_banner}>
          <DeclineButton org={org} />
        </Track>
      </Box>
    </Paper>
  )
}

export default PreviewInvite
