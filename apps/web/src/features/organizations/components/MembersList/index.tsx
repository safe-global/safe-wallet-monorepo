import { Box, Chip, IconButton, SvgIcon, Tooltip } from '@mui/material'
import { type UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import EditIcon from '@/public/images/common/edit.svg'
import { MemberRole } from '../AddMembersModal'
import DeleteIcon from '@/public/images/common/delete.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberDialog'
import { useState } from 'react'
import { useIsAdmin } from '@/features/organizations/hooks/useIsAdmin'
import EditMemberDialog from '@/features/organizations/components/MembersList/EditMemberDialog'
import { MemberStatus } from '../../hooks/useOrgMembers'

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

const EditButton = ({ member }: { member: UserOrganization }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title="Edit member" placement="top">
        <IconButton onClick={() => setOpen(true)} size="small">
          <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
        </IconButton>
      </Tooltip>
      {open && <EditMemberDialog member={member} handleClose={() => setOpen(false)} />}
    </>
  )
}

export const RemoveMemberButton = ({
  member,
  disabled,
  isInvite,
}: {
  member: UserOrganization
  disabled: boolean
  isInvite: boolean
}) => {
  const [openRemoveMemberDialog, setOpenRemoveMemberDialog] = useState(false)

  return (
    <>
      <Tooltip
        title={disabled ? 'Cannot remove last admin' : `Remove ${isInvite ? 'invitation' : 'member'}`}
        placement="top"
      >
        <Box component="span">
          <IconButton disabled={disabled} onClick={() => setOpenRemoveMemberDialog(true)} size="small">
            <SvgIcon component={DeleteIcon} inheritViewBox color={disabled ? 'disabled' : 'error'} fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
      {openRemoveMemberDialog && (
        <RemoveMemberDialog
          userId={member.user.id}
          memberName={member.name}
          handleClose={() => setOpenRemoveMemberDialog(false)}
          isInvite={isInvite}
        />
      )}
    </>
  )
}

const MembersList = ({ members }: { members: UserOrganization[] }) => {
  const isAdmin = useIsAdmin()
  const adminCount = members.filter((member) => member.role === MemberRole.ADMIN).length

  const rows = members.map((member) => {
    const isLastAdmin = adminCount === 1 && member.role === MemberRole.ADMIN
    const isInvite = member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED
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
          content: isAdmin ? (
            <div className={tableCss.actions}>
              {!isInvite && <EditButton member={member} />}
              <RemoveMemberButton member={member} disabled={isAdmin && isLastAdmin} isInvite={isInvite} />
            </div>
          ) : null,
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
