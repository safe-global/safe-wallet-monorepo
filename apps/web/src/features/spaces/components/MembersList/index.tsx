import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
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

const columns: DataTableColumn<MemberDto>[] = [
  { id: 'name', header: 'Name', className: 'w-[40%]', sortValue: (member) => member.name },
  { id: 'email', header: 'Email', className: 'w-[30%]', sortValue: (member) => member.user.email },
  { id: 'role', header: 'Role', className: 'w-[15%]', sortValue: (member) => member.role },
  { id: 'actions', className: 'w-[15%]' },
]

const EditButton = ({ member, disabled }: { member: MemberDto; disabled: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} disabled={disabled}>
            <EditIcon className="text-muted-foreground size-4 fill-current" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{disabled ? 'Cannot edit role of last admin' : 'Edit member'}</TooltipContent>
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
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Track
            {...SPACE_EVENTS.REMOVE_MEMBER_MODAL}
            label={isInvite ? SPACE_LABELS.invite_list : SPACE_LABELS.member_list}
          >
            <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={() => setOpenRemoveMemberDialog(true)}>
              <DeleteIcon
                className={cn('size-4 fill-current', disabled ? 'text-muted-foreground' : 'text-destructive')}
              />
            </Button>
          </Track>
        </TooltipTrigger>
        <TooltipContent>
          {disabled ? 'Cannot remove last admin' : `Remove ${isInvite ? 'invitation' : 'member'}`}
        </TooltipContent>
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
