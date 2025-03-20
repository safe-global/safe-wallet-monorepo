import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  SvgIcon,
  Typography,
} from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import {
  type GetOrganizationResponse,
  useOrganizationsDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useRouter } from 'next/router'
import { useState } from 'react'

const ListIcon = ({ variant }: { variant: 'success' | 'danger' }) => {
  const Icon = variant === 'success' ? CheckIcon : CloseIcon

  return (
    <ListItemIcon className={variant === 'success' ? css.success : css.danger}>
      <SvgIcon component={Icon} inheritViewBox />
    </ListItemIcon>
  )
}

const DeleteSpaceDialog = ({ space, onClose }: { space: GetOrganizationResponse | undefined; onClose: () => void }) => {
  const [error, setError] = useState<string>()
  const spaceId = useCurrentSpaceId()
  const router = useRouter()
  const [deleteSpace] = useOrganizationsDeleteV1Mutation()

  const onDelete = async () => {
    setError(undefined)

    try {
      await deleteSpace({ id: Number(spaceId) })

      onClose()
      router.push({ pathname: AppRoutes.welcome.spaces })
    } catch (e) {
      console.error(e)
      setError('Error deleting the space. Please try again.')
    }
  }

  return (
    <ModalDialog dialogTitle="Delete space" hideChainIndicator open onClose={onClose}>
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

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>No, keep it</Button>
        <Button variant="danger" onClick={onDelete}>
          Permanently delete it
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default DeleteSpaceDialog
