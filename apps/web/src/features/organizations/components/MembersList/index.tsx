import { Chip, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import EditIcon from '@/public/images/common/edit.svg'
import { MemberRole } from '../AddMembersModal'
import DeleteIcon from '@/public/images/common/delete.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'

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

const MembersList = ({ members }: { members: UserOrganization[] }) => {
  const rows = members.map((member) => {
    return {
      cells: {
        name: {
          rawValue: member.id,
          content: (
            <Stack direction="row" alignItems="center" justifyContent="left" gap={1}>
              User id: {member.id}
            </Stack>
          ),
        },
        role: {
          rawValue: member.role,
          content: (
            <Chip
              size="small"
              label={member.role === MemberRole.ADMIN ? 'Admin' : 'Member'}
              sx={{ backgroundColor: 'background.lightgrey', borderRadius: 0.5 }}
            />
          ),
        },
        actions: {
          rawValue: '',
          sticky: true,
          content: (
            <div className={tableCss.actions}>
              <Tooltip title="Edit entry" placement="top">
                <IconButton onClick={() => {}} size="small">
                  <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
                </IconButton>
              </Tooltip>
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
      <Typography variant="h5" fontWeight={700} mb={2} mt={1}>
        All Members ({members.length})
      </Typography>
      <EnhancedTable rows={rows} headCells={headCells} />
    </>
  )
}

export default MembersList
