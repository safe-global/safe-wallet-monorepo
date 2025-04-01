import ModalDialog from '@/components/common/ModalDialog'
import DialogContent from '@mui/material/DialogContent'
import UpdateSpaceForm from '@/features/spaces/components/SpaceSettings/UpdateSpaceForm'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Typography } from '@mui/material'
import { AppRoutes } from '@/config/routes'
import ExternalLink from '@/components/common/ExternalLink'

const UpdateSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse; onClose: () => void }) => {
  return (
    <ModalDialog dialogTitle="Update space" hideChainIndicator open onClose={onClose}>
      <DialogContent sx={{ mt: 2 }}>
        <Typography mb={2}>
          The space name is visible in the sidebar menu, headings to all its members. Usually it&apos;s a name of the
          company or a business. <ExternalLink href={AppRoutes.privacy}>How is this data stored?</ExternalLink>
        </Typography>
        <UpdateSpaceForm space={space} />
      </DialogContent>
    </ModalDialog>
  )
}

export default UpdateSpaceDialog
