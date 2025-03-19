import { Button, DialogActions, DialogContent, List, ListItem, ListItemIcon, SvgIcon, Typography } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import {
  type GetOrganizationResponse,
  useOrganizationsDeleteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import css from '@/features/organizations/components/OrgsSettings/styles.module.css'
import { AppRoutes } from '@/config/routes'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { useRouter } from 'next/router'

const ListIcon = ({ variant }: { variant: 'success' | 'danger' }) => {
  const Icon = variant === 'success' ? CheckIcon : CloseIcon

  return (
    <ListItemIcon className={variant === 'success' ? css.success : css.danger}>
      <SvgIcon component={Icon} inheritViewBox />
    </ListItemIcon>
  )
}

const DeleteOrgDialog = ({ org, onClose }: { org: GetOrganizationResponse | undefined; onClose: () => void }) => {
  const orgId = useCurrentOrgId()
  const router = useRouter()
  const [deleteOrg] = useOrganizationsDeleteV1Mutation()

  const onDelete = async () => {
    try {
      await deleteOrg({ id: Number(orgId) })

      onClose()
      router.push({ pathname: AppRoutes.welcome.organizations })
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <ModalDialog dialogTitle="Delete organization" hideChainIndicator open onClose={onClose}>
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
        <Button onClick={onClose}>No, keep it</Button>
        <Button variant="danger" onClick={onDelete}>
          Permanently delete it
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default DeleteOrgDialog
