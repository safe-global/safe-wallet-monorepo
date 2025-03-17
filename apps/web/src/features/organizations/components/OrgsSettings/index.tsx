import ModalDialog from '@/components/common/ModalDialog'
import { AppRoutes } from '@/config/routes'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import { useAppDispatch, useAppSelector } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import {
  Button,
  Card,
  DialogActions,
  DialogContent,
  Grid2,
  List,
  ListItem,
  ListItemIcon,
  SvgIcon,
  TextField,
  Typography,
} from '@mui/material'
import {
  useOrganizationsDeleteV1Mutation,
  useOrganizationsGetOneV1Query,
  useOrganizationsUpdateV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { isAuthenticated } from '@/store/authSlice'
import { useIsInvited } from '@/features/organizations/hooks/useOrgMembers'
import PreviewInvite from '@/features/organizations/components/InviteBanner/PreviewInvite'
import css from './styles.module.css'

const ListIcon = ({ variant }: { variant: 'success' | 'danger' }) => {
  const Icon = variant === 'success' ? CheckIcon : CloseIcon

  return (
    <ListItemIcon className={variant === 'success' ? css.success : css.danger}>
      <SvgIcon component={Icon} inheritViewBox />
    </ListItemIcon>
  )
}

type OrganizationFormData = {
  name: string
}

const OrgsSettings = () => {
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const orgId = useCurrentOrgId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: org } = useOrganizationsGetOneV1Query({ id: Number(orgId) }, { skip: !isUserSignedIn })
  const [updateOrg] = useOrganizationsUpdateV1Mutation()
  const [deleteOrg] = useOrganizationsDeleteV1Mutation()
  const isInvited = useIsInvited()
  const formMethods = useForm<OrganizationFormData>({
    mode: 'onChange',
    values: {
      name: org?.name || '',
    },
  })

  const { register, handleSubmit, watch } = formMethods

  const formName = watch('name')
  const isNameChanged = formName !== org?.name

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateOrg({ id: Number(orgId), updateOrganizationDto: { name: data.name } })

      dispatch(
        showNotification({
          variant: 'success',
          message: 'Successfully updated organization name',
          groupKey: 'org-update-name',
        }),
      )
    } catch (e) {
      console.log(e)
    }
  })

  const onDelete = async () => {
    try {
      await deleteOrg({ id: Number(orgId) })

      setDeleteOrgOpen(false)
      router.push({ pathname: AppRoutes.welcome.organizations })
    } catch (e) {
      console.log(e)
    }
  }

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

            <FormProvider {...formMethods}>
              <form onSubmit={onSubmit}>
                <TextField
                  {...register('name')}
                  label="Organization name"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Button variant="contained" type="submit" sx={{ mt: 2 }} disabled={!isNameChanged}>
                  Save
                </Button>
              </form>
            </FormProvider>
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
            >
              Delete organization
            </Button>
          </Grid2>
        </Grid2>
      </Card>
      <ModalDialog
        dialogTitle="Delete organization"
        hideChainIndicator
        open={deleteOrgOpen}
        onClose={() => setDeleteOrgOpen(false)}
      >
        <DialogContent sx={{ mt: 2 }}>
          <Typography mb={2}>
            Are you sure you want to delete <b>{org?.name}</b>? Deleting this organization:
          </Typography>

          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ListItem disablePadding>
              <ListIcon variant="danger" />
              Will permanently revoke access to organization data for you and its members
            </ListItem>
            <ListItem disablePadding>
              <ListIcon variant="danger" />
              Will remove members and Safe Accounts names from our database
            </ListItem>
            <ListItem disablePadding>
              <ListIcon variant="success" />
              Will keep access to the Safe Accounts added to this organization. They will not be deleted.
            </ListItem>
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteOrgOpen(false)}>No, keep it</Button>
          <Button variant="danger" onClick={onDelete}>
            Permanently delete it
          </Button>
        </DialogActions>
      </ModalDialog>
    </div>
  )
}

export default OrgsSettings
