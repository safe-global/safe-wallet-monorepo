import { Box, IconButton, SvgIcon, Tooltip as MuiTooltip } from '@mui/material'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberDialog'
import RenewInviteButton from './RenewInviteButton'
import { useState } from 'react'
import {
  useIsAdmin,
  isAdmin as checkIsAdmin,
  isActiveAdmin,
  isInviteExpired,
  MemberStatus,
  useAdminCount,
} from '@/features/spaces'
import EditMemberDialog from './EditMemberDialog'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import PaginatedDataTable, { type DataTableColumn } from '../PaginatedDataTable'

const columns: DataTableColumn[] = [
  { id: 'name', header: 'Name', className: 'w-[40%]' },
  { id: 'email', header: 'Email', className: 'w-[30%]' },
  { id: 'role', header: 'Role', className: 'w-[15%]' },
  { id: 'actions', className: 'w-[15%]' },
]

const EditButton = ({ member, disabled }: { member: MemberDto; disabled: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <MuiTooltip title={disabled ? 'Cannot edit role of last admin' : 'Edit member'} placement="top">
        <Box component="span">
          <IconButton onClick={() => setOpen(true)} size="small" disabled={disabled}>
            <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
          </IconButton>
        </Box>
      </MuiTooltip>
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
      <MuiTooltip
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
      </MuiTooltip>
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

  if (!members.length) {
    return null
  }

  return (
    <PaginatedDataTable
      columns={columns}
      rows={members}
      getRowKey={(member) => String(member.id)}
      renderRow={(member) => {
        const isLastAdmin = adminCount === 1 && isActiveAdmin(member)
        const isPendingInvite = member.status === MemberStatus.INVITED
        const isDeclined = member.status === MemberStatus.DECLINED
        const isInvite = isPendingInvite || isDeclined
        const isExpired = isInviteExpired(member)
        const isDisabled = isAdmin && isLastAdmin && !isInvite
        const memberEmail = member.user.email
        // Contract: Email invites can always be renewed (resending the email);
        // wallet invites are only renewed once they have expired.
        const canRenew = isPendingInvite && (Boolean(memberEmail) || isExpired)

        return (
          <>
            <TableCell data-testid="table-cell-name">
              <div className="flex items-center gap-2">
                <MemberName member={member} />
                {isDeclined && <Badge variant="destructive">Declined</Badge>}
                {isExpired && <Badge variant="warning">Expired</Badge>}
              </div>
            </TableCell>

            <TableCell data-testid="table-cell-email">
              {memberEmail ? (
                <Tooltip>
                  <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{memberEmail}</TooltipTrigger>
                  <TooltipContent>{memberEmail}</TooltipContent>
                </Tooltip>
              ) : null}
            </TableCell>

            <TableCell data-testid="table-cell-role">
              <Badge variant="secondary">{checkIsAdmin(member) ? 'Admin' : 'Member'}</Badge>
            </TableCell>

            <TableCell className="text-right" data-testid="table-cell-actions">
              {isAdmin ? (
                <span className="inline-flex items-center justify-end gap-1">
                  {!isInvite && <EditButton member={member} disabled={isDisabled} />}
                  {canRenew && <RenewInviteButton member={member} />}
                  <RemoveMemberButton member={member} disabled={isDisabled} isInvite={isInvite} />
                </span>
              ) : null}
            </TableCell>
          </>
        )
      }}
    />
  )
}

export default MembersList
