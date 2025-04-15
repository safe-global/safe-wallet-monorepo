import { useAppSelector } from '@/store'
import { Button, Card, Grid2, Typography } from '@mui/material'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useState } from 'react'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import { useIsAdmin, useIsInvited } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '@/features/spaces/components/InviteBanner/PreviewInvite'
import DeleteSpaceDialog from '@/features/spaces/components/SpaceSettings/DeleteSpaceDialog'
import UpdateSpaceForm from '@/features/spaces/components/SpaceSettings/UpdateSpaceForm'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import ExternalLink from '@/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'

const SpaceSettings = () => {
  const [deleteSpaceOpen, setDeleteSpaceOpen] = useState(false)
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const isInvited = useIsInvited()

  return (
    <div>
      {isInvited && <PreviewInvite />}
      <Typography variant="h2" mb={3}>
        Settings
      </Typography>
      <Card>
        <Grid2 container p={4} spacing={2}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Typography fontWeight="bold">General</Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <Typography mb={2}>
              The space name is visible in the sidebar menu, headings to all its members. Usually it&apos;s a name of
              the company or a business. <ExternalLink href={AppRoutes.privacy}>How is this data stored?</ExternalLink>
            </Typography>

            <UpdateSpaceForm space={space} />
          </Grid2>
        </Grid2>

        <Grid2 container p={4} spacing={2}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Typography fontWeight="bold">Danger Zone</Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <Typography mb={2}>This action cannot be undone.</Typography>

            <Button
              data-testid="space-delete-button"
              variant="danger"
              onClick={() => {
                setDeleteSpaceOpen(true)
                trackEvent({ ...SPACE_EVENTS.DELETE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
              }}
              disabled={!isAdmin}
            >
              Delete space
            </Button>
          </Grid2>
        </Grid2>
      </Card>
      {deleteSpaceOpen && <DeleteSpaceDialog space={space} onClose={() => setDeleteSpaceOpen(false)} />}
    </div>
  )
}

export default SpaceSettings
