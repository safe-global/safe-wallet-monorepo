import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { formatDate, formatTimeInWords, parseTimestamp } from '@safe-global/utils/utils/date'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
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
  getMemberDisplayName,
} from '@/features/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import EditMemberDialog from './EditMemberDialog'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import PaginatedDataTable, { type DataTableColumn } from '../PaginatedDataTable'
import { getMemberTwoFactorStatus, MemberTwoFactorBadge } from '@/features/oidc-auth'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'

type MembersListVariant = 'active' | 'pending'

// Sorts on the raw timestamp; renders a dash when there's no date.
const dateColumn = (
  id: string,
  header: string,
  getDate: (member: MemberDto) => string | null | undefined,
  render: (timestamp: number) => string,
): DataTableColumn<MemberDto> => ({
  id,
  header,
  width: '15%',
  minWidth: 110,
  // Hidden on mobile — surfaced in the expandable row detail instead
  priority: 'secondary',
  cellTestId: `table-cell-${id}`,
  sortValue: (member) => parseTimestamp(getDate(member)),
  cell: (member) => {
    const timestamp = parseTimestamp(getDate(member))
    return (
      <span className="text-muted-foreground block truncate text-xs">
        {timestamp !== null ? render(timestamp) : '–'}
      </span>
    )
  },
})

const DATE_COLUMNS: Record<MembersListVariant, DataTableColumn<MemberDto>[]> = {
  active: [dateColumn('memberSince', 'Member since', (member) => member.createdAt, formatDate)],
  pending: [
    dateColumn('invitedOn', 'Invited on', (member) => member.createdAt, formatDate),
    dateColumn('expires', 'Expires', (member) => member.inviteExpiresAt, formatTimeInWords),
  ],
}

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
        <TooltipContent>
          {disabled ? 'Cannot edit role of last admin' : `Edit ${checkIsAdmin(member) ? 'admin' : 'member'}`}
        </TooltipContent>
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
          memberName={getMemberDisplayName(member)}
          handleClose={() => setOpenRemoveMemberDialog(false)}
          isInvite={isInvite}
        />
      )}
    </>
  )
}

const MembersList = ({ members, variant = 'active' }: { members: MemberDto[]; variant?: MembersListVariant }) => {
  const isAdmin = useIsAdmin()
  const adminCount = useAdminCount(members)
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isTwoFactorEnabled = useHasFeature(FEATURES.SWITCH_AUTHENTICATOR)

  if (!members.length) {
    return null
  }

  // Per-row state shared by the name and actions cells
  const memberFlags = (member: MemberDto) => {
    const isLastAdmin = adminCount === 1 && isActiveAdmin(member)
    const isPendingInvite = member.status === MemberStatus.INVITED
    const isDeclined = member.status === MemberStatus.DECLINED
    const isInvite = isPendingInvite || isDeclined
    const isExpired = isInviteExpired(member)
    const isCurrentUser = member.user.id === currentUser?.id
    const isDisabled = isAdmin && isLastAdmin && !isInvite
    // The last admin can't be removed, but may still open edit to rename themselves.
    const editDisabled = isDisabled && !isCurrentUser
    const memberEmail = member.user.email
    // Contract: Email invites can always be renewed (resending the email);
    // wallet invites are only renewed once they have expired.
    const canRenew = isPendingInvite && (Boolean(memberEmail) || isExpired)
    return { isDeclined, isExpired, isInvite, isDisabled, editDisabled, canRenew, memberEmail }
  }

  // Widths must sum to 100% per configuration (variant × 2FA flag) — `table-fixed` overflows otherwise.
  const isCondensed = isTwoFactorEnabled && variant === 'pending'
  const badgeWidth = isCondensed ? '10%' : '15%'

  const twoFactorColumn: DataTableColumn<MemberDto> = {
    id: 'twoFactor',
    header: '2FA',
    width: badgeWidth,
    minWidth: 130,
    cellTestId: 'table-cell-2fa',
    sortValue: (m) => getMemberTwoFactorStatus(m),
    cell: (member) => <MemberTwoFactorBadge member={member} />,
  }

  const columns: DataTableColumn<MemberDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: isTwoFactorEnabled || variant === 'pending' ? '20%' : '35%',
      sticky: true,
      minWidth: 200,
      cellTestId: 'table-cell-name',
      sortValue: (m) => getMemberDisplayName(m),
      cell: (member, { isCompact }) => {
        const { isDeclined, isExpired, memberEmail } = memberFlags(member)
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <MemberName member={member} />
              {isDeclined && <Badge variant="destructive">Declined</Badge>}
              {isExpired && <Badge variant="warning">Expired</Badge>}
            </div>
            {/* The email column is hidden in the compact layout — surface it under the name instead */}
            {isCompact && memberEmail && (
              <span className="text-muted-foreground truncate pl-9 text-xs">{memberEmail}</span>
            )}
          </div>
        )
      },
    },
    {
      id: 'email',
      header: 'Email',
      width: isCondensed ? '15%' : '20%',
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
    ...(isTwoFactorEnabled ? [twoFactorColumn] : []),
    {
      id: 'role',
      header: 'Role',
      width: badgeWidth,
      minWidth: 90,
      cellTestId: 'table-cell-role',
      sortValue: (m) => m.role,
      cell: (member) => <Badge variant="secondary">{checkIsAdmin(member) ? 'Admin' : 'Member'}</Badge>,
    },
    ...DATE_COLUMNS[variant],
    {
      id: 'actions',
      width: '15%',
      align: 'end',
      cellTestId: 'table-cell-actions',
      minWidth: 80,
      cell: (member, { isCompact }) => {
        if (!isAdmin) return null
        const { isInvite, isDisabled, editDisabled, canRenew } = memberFlags(member)
        return isCompact ? (
          <MemberRowActionsMenu
            member={member}
            disabled={isDisabled}
            editDisabled={editDisabled}
            isInvite={isInvite}
            canRenew={canRenew}
          />
        ) : (
          <span className="inline-flex items-center justify-end gap-1">
            {!isInvite && <EditButton member={member} disabled={editDisabled} />}
            {canRenew && <RenewInviteButton member={member} />}
            <RemoveMemberButton member={member} disabled={isDisabled} isInvite={isInvite} />
          </span>
        )
      },
    },
  ]

  // Surfaces the date columns hidden on mobile (same pattern as the address book tables)
  const renderRowDetail = (member: MemberDto) => (
    <div className="flex flex-col gap-2 text-sm">
      {DATE_COLUMNS[variant].map((column) => (
        <div key={column.id} className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0">{column.header}</span>
          {column.cell(member, { isCompact: true })}
        </div>
      ))}
    </div>
  )

  return (
    <PaginatedDataTable
      columns={columns}
      rows={members}
      getRowKey={(member) => String(member.id)}
      renderRowDetail={renderRowDetail}
    />
  )
}

export default MembersList
