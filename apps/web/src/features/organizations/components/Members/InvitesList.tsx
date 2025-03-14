import EnhancedTable from '@/components/common/EnhancedTable'
import { Chip, IconButton, Stack, SvgIcon } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import DeleteIcon from '@/public/images/common/delete.svg'
import { MemberRole } from '../AddMembersModal'
import { MemberStatus } from '@/features/organizations/hooks/useOrgMembers'
import MemberName from '../MembersList/MemberName'
import { useIsAdmin } from '@/features/organizations/hooks/useIsAdmin'
import RemoveMemberDialog from '../MembersList/RemoveMemberModal'
import { useState } from 'react'

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
  const isAdmin = useIsAdmin()
  const [openRemoveMemberDialog, setOpenRemoveMemberDialog] = useState(false)

  const rows = invitedMembers.map((member) => {
    const isDeclined = member.status === MemberStatus.DECLINED

    return {
      cells: {
        name: {
          rawValue: member.user.id,
          content: (
            <Stack direction="row" alignItems="center" justifyContent="left" gap={1}>
              <MemberName member={member} />
              {isDeclined && (
                <Chip label="Declined" size="small" sx={{ backgroundColor: 'error.light', borderRadius: 0.5 }} />
              )}
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
            <>
              {isAdmin && (
                <div className={tableCss.actions}>
                  <IconButton onClick={() => setOpenRemoveMemberDialog(true)} size="small">
                    <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                  </IconButton>
                </div>
              )}
              {openRemoveMemberDialog && (
                <RemoveMemberDialog
                  userId={member.user.id}
                  memberName={member.name}
                  handleClose={() => setOpenRemoveMemberDialog(false)}
                  isInvite
                />
              )}
            </>
          ),
        },
      },
    }
  })

  return (
    <>
      <EnhancedTable rows={rows} headCells={headCells} />
    </>
  )
}

export default InvitesList
