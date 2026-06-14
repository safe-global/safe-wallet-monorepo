import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import TableCard from '@/components/common/TableCard'
import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
            <div className="flex flex-row items-center justify-start gap-2">
              <MemberName member={member} />
              {isDeclined && (
                <span className="inline-flex items-center rounded-sm bg-[var(--color-error-light)] px-2 py-0.5 text-xs text-[var(--color-static-main)]">
                  Declined
                </span>
              )}
            </div>
          ),
        },
        email: {
          rawValue: memberEmail,
          content: memberEmail ? <Typography variant="paragraph-small">{memberEmail}</Typography> : null,
        },
        role: {
          rawValue: member.role,
          content: <Chip className="rounded-sm">{checkIsAdmin(member) ? 'Admin' : 'Member'}</Chip>,
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

  return (
    <TableCard>
      <EnhancedTable rows={rows} headCells={headCells} />
    </TableCard>
  )
}

export default MembersList
