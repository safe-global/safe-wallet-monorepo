import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberDialog'
import RenewInviteButton from './RenewInviteButton'
import MemberRowActionsMenu from './MemberRowActionsMenu'
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

const EditButton = ({ member, disabled }: { member: MemberDto; disabled: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(true)}
            disabled={disabled}
            aria-label="Edit member"
          >
            <EditIcon className="size-4 text-muted-foreground" />
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
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={() => setOpenRemoveMemberDialog(true)}
              aria-label={`Remove ${isInvite ? 'invitation' : 'member'}`}
            >
              <DeleteIcon className={disabled ? 'size-4 text-muted-foreground' : 'size-4 text-destructive'} />
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
  const isMobile = useIsMobile()

  if (!members.length) {
    return null
  }

  // Per-row state shared by the name and actions cells
  const memberFlags = (member: MemberDto) => {
    const isLastAdmin = adminCount === 1 && isActiveAdmin(member)
    const isInvite = member.status === MemberStatus.INVITED || member.status === MemberStatus.DECLINED
    const isDeclined = member.status === MemberStatus.DECLINED
    const isDisabled = isAdmin && isLastAdmin && !isInvite
    const memberEmail = member.user.email
    const isPendingInvite = member.status === MemberStatus.INVITED
    const isExpired = isInviteExpired(member)
    // Contract: Email invites can always be renewed (resending the email);
    // wallet invites are only renewed once they have expired.
    const canRenew = isPendingInvite && (Boolean(memberEmail) || isExpired)
    return { isDeclined, isExpired, isInvite, isDisabled, canRenew, memberEmail }
  }

  const columns: DataTableColumn<MemberDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: '40%',
      sticky: true,
      minWidth: 200,
      cellTestId: 'table-cell-name',
      sortValue: (m) => m.name,
      cell: (member) => {
        const { isDeclined, isExpired, memberEmail } = memberFlags(member)
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <MemberName member={member} />
              {isDeclined && <Badge variant="destructive">Declined</Badge>}
              {isExpired && <Badge variant="warning">Expired</Badge>}
            </div>
            {/* The email column is hidden on mobile — surface it under the name instead */}
            {isMobile && memberEmail && (
              <span className="text-muted-foreground truncate pl-9 text-xs">{memberEmail}</span>
            )}
          </div>
        )
      },
    },
    {
      id: 'email',
      header: 'Email',
      width: '30%',
      priority: 'secondary',
      minWidth: 180,
      cellTestId: 'table-cell-email',
      sortValue: (m) => m.user.email,
      cell: (member) =>
        member.user.email ? (
          <Tooltip>
            <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{member.user.email}</TooltipTrigger>
            <TooltipContent>{member.user.email}</TooltipContent>
          </Tooltip>
        ) : null,
    },
    {
      id: 'role',
      header: 'Role',
      width: '15%',
      minWidth: 90,
      cellTestId: 'table-cell-role',
      sortValue: (m) => m.role,
      cell: (member) => <Badge variant="secondary">{checkIsAdmin(member) ? 'Admin' : 'Member'}</Badge>,
    },
    {
      id: 'actions',
      width: '15%',
      align: 'end',
      cellTestId: 'table-cell-actions',
      minWidth: 80,
      cell: (member) => {
        if (!isAdmin) return null
        const { isInvite, isDisabled, canRenew } = memberFlags(member)
        return isMobile ? (
          <MemberRowActionsMenu member={member} disabled={isDisabled} isInvite={isInvite} canRenew={canRenew} />
        ) : (
          <span className="inline-flex items-center justify-end gap-1">
            {!isInvite && <EditButton member={member} disabled={isDisabled} />}
            {canRenew && <RenewInviteButton member={member} />}
            <RemoveMemberButton member={member} disabled={isDisabled} isInvite={isInvite} />
          </span>
        )
      },
    },
  ]

  return <PaginatedDataTable columns={columns} rows={members} getRowKey={(member) => String(member.id)} />
}

export default MembersList
