import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { formatTimeInWords, formatWithSchema } from '@safe-global/utils/utils/date'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/utils/cn'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberDialog'
import RenewInviteButton from './RenewInviteButton'
import MemberRowActionsMenu from './MemberRowActionsMenu'
import { useState, type ReactNode } from 'react'
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
import { Typography } from '@mui/material'

type MembersListVariant = 'active' | 'pending'

const DATE_FORMAT = 'MMM d, yyyy'

const formatDate = (timestamp: number) => formatWithSchema(timestamp, DATE_FORMAT)

// `format` throws on invalid dates, so resolve to a timestamp only when the value parses.
const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

type DateCell = { rawValue: string | number | null; content: ReactNode }

// Sorts on the raw timestamp; renders a dash when there's no date. `formatDate` gives an absolute
// date (join / invite date), `formatTimeInWords` a relative one ("in 6 days" / "5 days ago") so an
// invite's remaining lifetime is readable at a glance instead of looking like its creation date.
const dateCell = (timestamp: number | null, render: (timestamp: number) => string): DateCell => ({
  rawValue: timestamp,
  content: (
    <Typography variant="body2" color="text.secondary" noWrap>
      {timestamp !== null ? render(timestamp) : '–'}
    </Typography>
  ),
})

const getHeadCells = (variant: MembersListVariant) => [
  {
    id: 'name',
    label: 'Name',
    width: variant === 'pending' ? '22%' : '28%',
  },
  {
    id: 'email',
    label: 'Email',
    width: variant === 'pending' ? '22%' : '26%',
  },
  {
    id: 'role',
    label: 'Role',
    width: variant === 'pending' ? '12%' : '14%',
  },
  // Active members show when they joined; pending invites show when they were invited plus how
  // long the invite has left.
  ...(variant === 'pending'
    ? [
        { id: 'invitedOn', label: 'Invited on', width: '16%' },
        { id: 'expires', label: 'Expires', width: '16%' },
      ]
    : [{ id: 'memberSince', label: 'Member since', width: '20%' }]),
  {
    id: 'actions',
    label: '',
    width: '12%',
    sticky: true,
  },
]

// Precompute per variant — the column set only depends on `variant`, so there's no need to rebuild
// it on every render.
const HEAD_CELLS: Record<MembersListVariant, ReturnType<typeof getHeadCells>> = {
  active: getHeadCells('active'),
  pending: getHeadCells('pending'),
}

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
  const isMobile = useIsMobile()
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
    const createdTimestamp = toTimestamp(member.createdAt)
    const dateCells: Record<string, DateCell> =
      variant === 'pending'
        ? {
            invitedOn: dateCell(createdTimestamp, formatDate),
            expires: dateCell(toTimestamp(member.inviteExpiresAt), formatTimeInWords),
          }
        : { memberSince: dateCell(createdTimestamp, formatDate) }
    return { isDeclined, isExpired, isInvite, isDisabled, editDisabled, canRenew, memberEmail }
  }

  // The 2FA column takes its share from name and email so the widths still total 100%
  const twoFactorColumn: DataTableColumn<MemberDto> = {
    id: 'twoFactor',
    header: '2FA',
    width: '15%',
    minWidth: 130,
    cellTestId: 'table-cell-2fa',
    sortValue: (m) => getMemberTwoFactorStatus(m),
    cell: (member) => <MemberTwoFactorBadge member={member} />,
  }

  const columns: DataTableColumn<MemberDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: isTwoFactorEnabled ? '35%' : '40%',
      sticky: true,
      minWidth: 200,
      cellTestId: 'table-cell-name',
      sortValue: (m) => getMemberDisplayName(m),
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
      width: isTwoFactorEnabled ? '20%' : '30%',
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
        const { isInvite, isDisabled, editDisabled, canRenew } = memberFlags(member)
        return isMobile ? (
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

  return <PaginatedDataTable columns={columns} rows={members} getRowKey={(member) => String(member.id)} />
  // return <EnhancedTable rows={rows} headCells={HEAD_CELLS[variant]} fixedLayout />
}

export default MembersList
