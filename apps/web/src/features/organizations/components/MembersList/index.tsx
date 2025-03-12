import { Box, Chip, IconButton, SvgIcon, Tooltip } from '@mui/material'
import { type UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import EditIcon from '@/public/images/common/edit.svg'
import { MemberRole } from '../AddMembersModal'
import DeleteIcon from '@/public/images/common/delete.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberModal'
import { useState } from 'react'
import { useIsAdmin } from '@/features/organizations/hooks/useIsAdmin'

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

const MenuButtons = ({ member, disableDelete }: { member: UserOrganization; disableDelete: boolean }) => {
  const [openRemoveMemberDialog, setOpenRemoveMemberDialog] = useState(false)

  return (
    <div className={tableCss.actions}>
      <Tooltip title="Edit member name" placement="top">
        <IconButton onClick={() => {}} size="small">
          <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={disableDelete ? 'Cannot delete last admin' : 'Remove member'} placement="top">
        <Box component="span">
          <IconButton disabled={disableDelete} onClick={() => setOpenRemoveMemberDialog(true)} size="small">
            <SvgIcon
              component={DeleteIcon}
              inheritViewBox
              color={disableDelete ? 'disabled' : 'error'}
              fontSize="small"
            />
          </IconButton>
        </Box>
      </Tooltip>
      {openRemoveMemberDialog && (
        <RemoveMemberDialog member={member.user} handleClose={() => setOpenRemoveMemberDialog(false)} />
      )}
    </div>
  )
}

const MembersList = ({ members }: { members: UserOrganization[] }) => {
  const isAdmin = useIsAdmin()
  const adminCount = members.filter((member) => member.role === MemberRole.ADMIN).length

  const rows = members.map((member) => {
    const isLastAdmin = adminCount === 1 && member.role === MemberRole.ADMIN
    return {
      cells: {
        name: {
          rawValue: member.user.id,
          content: <MemberName member={member} />,
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
          content: isAdmin ? <MenuButtons member={member} disableDelete={isLastAdmin} /> : null,
        },
      },
    }
  })

  if (!rows.length) {
    return null
  }

  return <EnhancedTable rows={rows} headCells={headCells} />
}

export default MembersList
