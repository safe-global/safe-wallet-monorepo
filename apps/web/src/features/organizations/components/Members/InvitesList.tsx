import EnhancedTable from '@/components/common/EnhancedTable'
import { Button, Chip, IconButton, Stack, SvgIcon } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useUserOrganizationsRemoveUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import DeleteIcon from '@/public/images/common/delete.svg'
import { MemberRole } from '../AddMembersModal'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { MemberStatus } from '@/features/organizations/hooks/useOrgMembers'
import MemberName from '../MembersList/MemberName'

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
  const [deleteInvite] = useUserOrganizationsRemoveUserV1Mutation()
  const currentOrgId = useCurrentOrgId()

  const handleDeleteInvite = async (invitedId: number) => {
    try {
      await deleteInvite({ orgId: Number(currentOrgId), userId: invitedId })
    } catch (error) {
      // TODO: handle error
    }
  }

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
            <div className={tableCss.actions}>
              {isDeclined && (
                <Button variant="outlined" size="small" sx={{ px: 2, py: 0.5, mr: 1 }} onClick={() => {}}>
                  Resend
                </Button>
              )}
              <IconButton onClick={() => handleDeleteInvite(member.user.id)} size="small">
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
      <EnhancedTable rows={rows} headCells={headCells} />
    </>
  )
}

export default InvitesList
