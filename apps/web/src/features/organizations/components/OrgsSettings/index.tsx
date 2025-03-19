import { useAppSelector } from '@/store'
import { Button, Card, Grid2, Typography } from '@mui/material'
import { useOrganizationsGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useState } from 'react'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { isAuthenticated } from '@/store/authSlice'
import { useIsAdmin, useIsInvited } from '@/features/organizations/hooks/useOrgMembers'
import PreviewInvite from '@/features/organizations/components/InviteBanner/PreviewInvite'
import DeleteOrgDialog from '@/features/organizations/components/OrgsSettings/DeleteOrgDialog'
import UpdateOrgForm from '@/features/organizations/components/OrgsSettings/UpdateOrgForm'

const OrgsSettings = () => {
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const isAdmin = useIsAdmin()
  const orgId = useCurrentOrgId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: org } = useOrganizationsGetOneV1Query({ id: Number(orgId) }, { skip: !isUserSignedIn })
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
              The organization name is visible in the sidebar menu, headings to all its members. Usually it’s a name of
              the company or a business. How is this data stored?
            </Typography>

            <UpdateOrgForm org={org} />
          </Grid2>
        </Grid2>

        <Grid2 container p={4} spacing={2}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Typography fontWeight="bold">Danger Zone</Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <Typography mb={2}>This action cannot be undone.</Typography>

            <Button
              variant="danger"
              onClick={() => {
                setDeleteOrgOpen(true)
              }}
              disabled={!isAdmin}
            >
              Delete organization
            </Button>
          </Grid2>
        </Grid2>
      </Card>
      {deleteOrgOpen && <DeleteOrgDialog org={org} onClose={() => setDeleteOrgOpen(false)} />}
    </div>
  )
}

export default OrgsSettings
