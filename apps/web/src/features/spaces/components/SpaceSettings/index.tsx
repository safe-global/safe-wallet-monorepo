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
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import { useIsAdmin, useIsInvited } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '@/features/spaces/components/InviteBanner/PreviewInvite'
import css from './styles.module.css'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const ListIcon = ({ variant }: { variant: 'success' | 'danger' }) => {
  const Icon = variant === 'success' ? CheckIcon : CloseIcon

  return (
    <ListItemIcon className={variant === 'success' ? css.success : css.danger}>
      <SvgIcon component={Icon} inheritViewBox />
    </ListItemIcon>
  )
}

type SpaceFormData = {
  name: string
}

const SpaceSettings = () => {
  const [deleteSpaceOpen, setDeleteSpaceOpen] = useState(false)
  const isAdmin = useIsAdmin()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useOrganizationsGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })
  const [updateSpace] = useOrganizationsUpdateV1Mutation()
  const [deleteSpace] = useOrganizationsDeleteV1Mutation()
  const isInvited = useIsInvited()
  const formMethods = useForm<SpaceFormData>({
    mode: 'onChange',
    values: {
      name: space?.name || '',
    },
  })

  const { register, handleSubmit, watch } = formMethods

  const formName = watch('name')
  const isNameChanged = formName !== space?.name

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateSpace({ id: Number(spaceId), updateOrganizationDto: { name: data.name } })

      dispatch(
        showNotification({
          variant: 'success',
          message: 'Successfully updated space name',
          groupKey: 'space-update-name',
        }),
      )
    } catch (e) {
      console.log(e)
    }
  })

  const onDelete = async () => {
    trackEvent({ ...SPACE_EVENTS.REMOVE_SPACE })
    try {
      await deleteSpace({ id: Number(spaceId) })

      setDeleteSpaceOpen(false)
      router.push({ pathname: AppRoutes.welcome.spaces })
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
              {/* TODO: Add link to how is this data stored */}
              The space name is visible in the sidebar menu, headings to all its members. Usually it’s a name of the
              company or a business. How is this data stored?
            </Typography>

            <FormProvider {...formMethods}>
              <form onSubmit={onSubmit}>
                <TextField
                  {...register('name')}
                  label="Space name"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Button variant="contained" type="submit" sx={{ mt: 2 }} disabled={!isNameChanged || !isAdmin}>
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
                setDeleteSpaceOpen(true)
                trackEvent({ ...SPACE_EVENTS.REMOVE_SPACE_MODAL })
              }}
              disabled={!isAdmin}
            >
              Delete space
            </Button>
          </Grid2>
        </Grid2>
      </Card>
      <ModalDialog
        dialogTitle="Delete space"
        hideChainIndicator
        open={deleteSpaceOpen}
        onClose={() => setDeleteSpaceOpen(false)}
      >
        <DialogContent sx={{ mt: 2 }}>
          <Typography mb={2}>
            Are you sure you want to delete <b>{space?.name}</b>? Deleting this space:
          </Typography>

          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ListItem disablePadding>
              <ListIcon variant="danger" />
              Will permanently revoke access to space data for you and its members
            </ListItem>
            <ListItem disablePadding>
              <ListIcon variant="danger" />
              Will remove members and Safe Accounts names from our database
            </ListItem>
            <ListItem disablePadding>
              <ListIcon variant="success" />
              Will keep access to the Safe Accounts added to this space. They will not be deleted.
            </ListItem>
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteSpaceOpen(false)}>No, keep it</Button>
          <Button variant="danger" onClick={onDelete}>
            Permanently delete it
          </Button>
        </DialogActions>
      </ModalDialog>
    </div>
  )
}

export default SpaceSettings
