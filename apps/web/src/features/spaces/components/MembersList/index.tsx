import { Box, Chip, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { formatTimeInWords, formatWithSchema } from '@safe-global/utils/utils/date'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import MemberName from './MemberName'
import RemoveMemberDialog from './RemoveMemberDialog'
import RenewInviteButton from './RenewInviteButton'
import { useState, type ReactNode } from 'react'
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

const MembersList = ({ members, variant = 'active' }: { members: MemberDto[]; variant?: MembersListVariant }) => {
  const isAdmin = useIsAdmin()
  const adminCount = useAdminCount(members)

  const rows = members.map((member) => {
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
    const createdTimestamp = toTimestamp(member.createdAt)
    const dateCells: Record<string, DateCell> =
      variant === 'pending'
        ? {
            invitedOn: dateCell(createdTimestamp, formatDate),
            expires: dateCell(toTimestamp(member.inviteExpiresAt), formatTimeInWords),
          }
        : { memberSince: dateCell(createdTimestamp, formatDate) }

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
              {isExpired && (
                <Chip
                  label="Expired"
                  size="small"
                  sx={{ backgroundColor: 'warning.main', color: 'static.main', borderRadius: 0.5 }}
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
        ...dateCells,
        actions: {
          rawValue: '',
          sticky: true,
          content: isAdmin ? (
            <div className={tableCss.actions}>
              {!isInvite && <EditButton member={member} disabled={isDisabled} />}
              {canRenew && <RenewInviteButton member={member} />}
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

  return <EnhancedTable rows={rows} headCells={HEAD_CELLS[variant]} fixedLayout />
}

export default MembersList
