import ModalDialog from '@/components/common/ModalDialog'
import DialogContent from '@mui/material/DialogContent'
import UpdateOrgForm from '@/features/organizations/components/OrgsSettings/UpdateOrgForm'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { Typography } from '@mui/material'

const UpdateOrgDialog = ({ org, onClose }: { org: GetOrganizationResponse; onClose: () => void }) => {
  return (
    <ModalDialog dialogTitle="Update organization" hideChainIndicator open onClose={onClose}>
      <DialogContent sx={{ mt: 2 }}>
        <Typography mb={2}>
          The organization name is visible in the sidebar menu, headings to all its members. Usually it&apos;s a name of
          the company or a business. How is this data stored?
        </Typography>
        <UpdateOrgForm org={org} />
      </DialogContent>
    </ModalDialog>
  )
}

export default UpdateOrgDialog
