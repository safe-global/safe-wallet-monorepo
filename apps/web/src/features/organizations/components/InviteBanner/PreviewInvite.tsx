import { Typography, Paper, Box } from '@mui/material'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { InitialsAvatar } from '../OrgsCard'
import InviteButtons from './InviteButtons'
import css from './styles.module.css'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'
import { isAuthenticated } from '@/store/authSlice'
import { useAppSelector } from '@/store'

const PreviewInvite = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const orgId = useCurrentOrgId()
  const { data: org } = useOrganizationsGetOneV1Query({ id: Number(orgId) }, { skip: !isUserSignedIn })

  if (!org) return null

  return (
    <Paper sx={{ p: 2, mb: 4, backgroundColor: '#d7f6ff' }}>
      <Box className={css.previewInviteContent}>
        <InitialsAvatar name={org.name} size="medium" />
        <Typography variant="body1" color="text.primary" flexGrow={1}>
          You were invited to join <strong>{org.name}</strong>
        </Typography>
        <InviteButtons org={org} />
      </Box>
    </Paper>
  )
}

export default PreviewInvite
