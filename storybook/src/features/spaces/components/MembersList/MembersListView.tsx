import { useState, type ReactNode } from 'react'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { formatDate, formatTimeInWords, parseTimestamp } from '@safe-global/utils/utils/date'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'

export type MembersListViewVariant = 'active' | 'pending'

export type MemberRowFlags = {
  isDeclined: boolean
  isExpired: boolean
  isInvite: boolean
  isDisabled: boolean
  editDisabled: boolean
  canRenew: boolean
}

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

const DATE_COLUMNS: Record<MembersListViewVariant, DataTableColumn<MemberDto>[]> = {
  active: [dateColumn('memberSince', 'Member since', (member) => member.createdAt, formatDate)],
  pending: [
    dateColumn('invitedOn', 'Invited on', (member) => member.createdAt, formatDate),
    dateColumn('expires', 'Expires', (member) => member.inviteExpiresAt, formatTimeInWords),
  ],
}

export type EditMemberButtonViewProps = {
  disabled: boolean
  isMemberAdmin: boolean
  renderDialog: (onClose: () => void) => ReactNode
}

const EditMemberButtonView = ({ disabled, isMemberAdmin, renderDialog }: EditMemberButtonViewProps) => {
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
          {disabled ? 'Cannot edit role of last admin' : `Edit ${isMemberAdmin ? 'admin' : 'member'}`}
        </TooltipContent>
      </Tooltip>
      {open && renderDialog(() => setOpen(false))}
    </>
  )
}

export type RemoveMemberButtonViewProps = {
  disabled: boolean
  isInvite: boolean
  renderDialog: (onClose: () => void) => ReactNode
}

export const RemoveMemberButtonView = ({ disabled, isInvite, renderDialog }: RemoveMemberButtonViewProps) => {
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
      {openRemoveMemberDialog && renderDialog(() => setOpenRemoveMemberDialog(false))}
    </>
  )
}

export type MembersListViewProps = {
  members: MemberDto[]
  variant: MembersListViewVariant
  isAdmin: boolean
  isTwoFactorEnabled: boolean
  getFlags: (member: MemberDto) => MemberRowFlags
  getDisplayName: (member: MemberDto) => string
  getIdentifierValue: (member: MemberDto) => string | null
  getTwoFactorStatus: (member: MemberDto) => string | undefined
  isMemberAdmin: (member: MemberDto) => boolean
  renderMemberName: (member: MemberDto, isCompact: boolean) => ReactNode
  renderMemberIdentifier: (member: MemberDto, props?: { className: string }) => ReactNode
  renderTwoFactorBadge: (member: MemberDto) => ReactNode
  renderRowActionsMenu: (member: MemberDto, flags: MemberRowFlags) => ReactNode
  renderRenewInviteButton: (member: MemberDto) => ReactNode
  renderEditDialog: (member: MemberDto, onClose: () => void) => ReactNode
  renderRemoveDialog: (member: MemberDto, isInvite: boolean, onClose: () => void) => ReactNode
}

export const MembersListView = ({
  members,
  variant,
  isAdmin,
  isTwoFactorEnabled,
  getFlags,
  getDisplayName,
  getIdentifierValue,
  getTwoFactorStatus,
  isMemberAdmin,
  renderMemberName,
  renderMemberIdentifier,
  renderTwoFactorBadge,
  renderRowActionsMenu,
  renderRenewInviteButton,
  renderEditDialog,
  renderRemoveDialog,
}: MembersListViewProps) => {
  // Widths must sum to 100% per configuration (variant × 2FA flag) — `table-fixed` overflows otherwise.
  const isCondensed = isTwoFactorEnabled && variant === 'pending'
  const badgeWidth = isCondensed ? '10%' : '15%'

  const twoFactorColumn: DataTableColumn<MemberDto> = {
    id: 'twoFactor',
    header: '2FA',
    width: badgeWidth,
    minWidth: 130,
    priority: 'secondary',
    cellTestId: 'table-cell-2fa',
    sortValue: (m) => getTwoFactorStatus(m),
    cell: (member) => renderTwoFactorBadge(member),
  }

  const columns: DataTableColumn<MemberDto>[] = [
    {
      id: 'name',
      header: 'Name',
      width: isTwoFactorEnabled || variant === 'pending' ? '20%' : '35%',
      sticky: true,
      minWidth: 200,
      cellTestId: 'table-cell-name',
      sortValue: (m) => getDisplayName(m),
      cell: (member, { isCompact }) => {
        const { isDeclined, isExpired } = getFlags(member)
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              {renderMemberName(member, isCompact)}
              {isDeclined && (
                <Badge variant="destructive" className="shrink-0">
                  Declined
                </Badge>
              )}
              {isExpired && (
                <Badge variant="warning" className="shrink-0">
                  Expired
                </Badge>
              )}
            </div>
            {/* The identifier column is hidden in the compact layout — surface it under the name instead */}
            {isCompact && renderMemberIdentifier(member, { className: 'text-muted-foreground pl-9 text-xs' })}
          </div>
        )
      },
    },
    {
      id: 'email',
      header: 'Email or address',
      width: isCondensed ? '15%' : '20%',
      priority: 'secondary',
      minWidth: 180,
      cellTestId: 'table-cell-email',
      sortValue: (m) => getIdentifierValue(m),
      cell: (member) => renderMemberIdentifier(member),
    },
    ...(isTwoFactorEnabled ? [twoFactorColumn] : []),
    {
      id: 'role',
      header: 'Role',
      width: badgeWidth,
      minWidth: 90,
      cellTestId: 'table-cell-role',
      sortValue: (m) => m.role,
      cell: (member) => <Badge variant="secondary">{isMemberAdmin(member) ? 'Admin' : 'Member'}</Badge>,
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
        const flags = getFlags(member)
        const { isInvite, isDisabled, editDisabled, canRenew } = flags
        return isCompact ? (
          renderRowActionsMenu(member, flags)
        ) : (
          <span className="inline-flex items-center justify-end gap-1">
            {!isInvite && (
              <EditMemberButtonView
                disabled={editDisabled}
                isMemberAdmin={isMemberAdmin(member)}
                renderDialog={(onClose) => renderEditDialog(member, onClose)}
              />
            )}
            {canRenew && renderRenewInviteButton(member)}
            <RemoveMemberButtonView
              disabled={isDisabled}
              isInvite={isInvite}
              renderDialog={(onClose) => renderRemoveDialog(member, isInvite, onClose)}
            />
          </span>
        )
      },
    },
  ]

  // Surfaces the columns hidden on mobile; 2FA joins them only where the member has a status to show.
  const renderRowDetail = (member: MemberDto) => {
    const detailColumns = [
      ...(isTwoFactorEnabled && getTwoFactorStatus(member) ? [twoFactorColumn] : []),
      ...DATE_COLUMNS[variant],
    ]

    return (
      <div className="flex flex-col gap-2 text-sm">
        {detailColumns.map((column) => (
          <div key={column.id} className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground w-24 shrink-0">{column.header}</span>
            {column.cell(member, { isCompact: true })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <PaginatedDataTable
      columns={columns}
      rows={members}
      getRowKey={(member) => String(member.id)}
      renderRowDetail={renderRowDetail}
    />
  )
}
