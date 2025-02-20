import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Chip, IconButton, SvgIcon, Typography } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import DeleteIcon from '@/public/images/common/delete.svg'

const headCells = [
  {
    id: 'name',
    label: 'Name',
    width: '70%',
  },
  {
    id: 'role',
    label: 'Role',
    width: '15%',
  },
  {
    id: 'actions',
    label: '',
    width: '15%',
    sticky: true,
  },
]

const InvitesList = ({ invitedMembers }: { invitedMembers: UserOrganization[] }) => {
  const rows = invitedMembers.map((member) => {
    return {
      cells: {
        name: {
          rawValue: member.user.id,
          content: <EthHashInfo address="0x0000000000000000000000000000000000000000" showCopyButton hasExplorer />,
        },
        role: {
          rawValue: member.role,
          content: <Chip label={member.role} />,
        },
        actions: {
          rawValue: '',
          sticky: true,
          content: (
            <div className={tableCss.actions}>
              <IconButton onClick={() => {}} size="small">
                <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
              </IconButton>
            </div>
          ),
        },
      },
    }
  })

  return (
    <>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Pending Invitations
      </Typography>
      <EnhancedTable rows={rows} headCells={headCells} />
    </>
  )
}

export default InvitesList
