import EnhancedTable from '@/components/common/EnhancedTable'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Box, Button, Chip, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import DeleteIcon from '@/public/images/common/delete.svg'
import { MemberStatus } from '.'
import { MemberRole } from '../AddMembersModal'

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
    const isDeclined = member.status === MemberStatus.DECLINED
    return {
      cells: {
        name: {
          rawValue: member.user.id,
          content: (
            <Stack direction="row" alignItems="center" justifyContent="left" gap={1}>
              <Box>
                <EthHashInfo address="0x0000000000000000000000000000000000000000" showCopyButton hasExplorer />
              </Box>
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
