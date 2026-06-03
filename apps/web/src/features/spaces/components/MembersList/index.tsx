import { Box, Chip, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberDialog'
import { useState } from 'react'
import { useIsAdmin, isAdmin as checkIsAdmin, isActiveAdmin, MemberStatus, useAdminCount } from '@/features/spaces'
import EditMemberDialog from './EditMemberDialog'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'

const headCells = [
  {
    id: 'name',
    label: 'Name',
    width: '40%',
  },
  {
    id: 'email',
    label: 'Email',
    width: '30%',
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

const EditButton = ({ member, disabled }: { member: MemberDto; disabled: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title={disabled ? 'Cannot edit role of last admin' : 'Edit member'} placement="top">
        <Box component="span">
          <IconButton onClick={() => setOpen(true)} size="small" disabled={disabled}>
            <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
          </IconButton>
        </Box>
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
  member: MemberDto
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
          <Track
            {...SPACE_EVENTS.REMOVE_MEMBER_MODAL}
            label={isInvite ? SPACE_LABELS.invite_list : SPACE_LABELS.member_list}
          >
            <IconButton disabled={disabled} onClick={() => setOpenRemoveMemberDialog(true)} size="small">
              <SvgIcon component={DeleteIcon} inheritViewBox color={disabled ? 'disabled' : 'error'} fontSize="small" />
            </IconButton>
          </Track>
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

const MembersList = ({ members }: { members: MemberDto[] }) => {
  const isAdmin = useIsAdmin()
  const adminCount = useAdminCount(members)

  const rows = members.map((member) => {
    const isLastAdmin = adminCount === 1 && isActiveAdmin(member)
    const isInvite = member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED
    const isDeclined = member.status === MemberStatus.DECLINED
    const isDisabled = isAdmin && isLastAdmin && !isInvite
    const memberEmail = member.user.email

    return {
      cells: {
        name: {
          rawValue: member.name,
          content: (
            <Stack direction="row" alignItems="center" justifyContent="left" gap={1}>
              <MemberName member={member} />
              {isDeclined && (
                <Chip
                  label="Declined"
                  size="small"
                  sx={{ backgroundColor: 'error.light', color: 'static.main', borderRadius: 0.5 }}
                />
              )}
            </Stack>
          ),
        },
        email: {
          rawValue: memberEmail,
          content: memberEmail ? (
            <Tooltip title={memberEmail} placement="top">
              <Typography variant="body2" noWrap sx={{ display: 'inline-block', maxWidth: '100%' }}>
                {memberEmail}
              </Typography>
            </Tooltip>
          ) : null,
        },
        role: {
          rawValue: member.role,
          content: (
            <Chip
              size="small"
              label={checkIsAdmin(member) ? 'Admin' : 'Member'}
              sx={{ backgroundColor: 'background.lightgrey', borderRadius: 0.5 }}
            />
          ),
        },
        actions: {
          rawValue: '',
          sticky: true,
          content: isAdmin ? (
            <div className={tableCss.actions}>
              {!isInvite && <EditButton member={member} disabled={isDisabled} />}
              <RemoveMemberButton member={member} disabled={isDisabled} isInvite={isInvite} />
            </div>
          ) : null,
        },
      },
    }
  })

  if (!rows.length) {
    return null
  }

  return <EnhancedTable rows={rows} headCells={headCells} fixedLayout />
}

export default MembersList
