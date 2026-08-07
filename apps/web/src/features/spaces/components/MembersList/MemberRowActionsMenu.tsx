import { useState } from 'react'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import EditMemberDialog from './EditMemberDialog'
import RemoveMemberDialog from './RemoveMemberDialog'
import useRenewInvite from './useRenewInvite'
import { getMemberDisplayName } from '../../hooks/useSpaceMembers'

type MemberRowActionsMenuProps = {
  member: MemberDto
  disabled: boolean
  // Edit stays enabled for the current user (to rename themselves) even when remove is disabled.
  editDisabled: boolean
  isInvite: boolean
  canRenew: boolean
}

/**
 * Mobile-only kebab that collapses the per-row member actions (edit / renew / remove)
 * into a single menu, replacing the desktop icon cluster on narrow viewports.
 */
const MemberRowActionsMenu = ({ member, disabled, editDisabled, isInvite, canRenew }: MemberRowActionsMenuProps) => {
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const { renewInvite, isLoading } = useRenewInvite(member)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Member actions">
              <EllipsisVertical className="text-muted-foreground size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {!isInvite && (
            <DropdownMenuItem disabled={editDisabled} onClick={() => setEditOpen(true)}>
              Edit member
            </DropdownMenuItem>
          )}
          {canRenew && (
            <Track {...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_RENEWED} label={SPACE_LABELS.invite_list}>
              <DropdownMenuItem disabled={isLoading} onClick={() => renewInvite()}>
                Renew invitation
              </DropdownMenuItem>
            </Track>
          )}
          <Track
            {...SPACE_EVENTS.REMOVE_MEMBER_MODAL}
            label={isInvite ? SPACE_LABELS.invite_list : SPACE_LABELS.member_list}
          >
            <DropdownMenuItem variant="destructive" disabled={disabled} onClick={() => setRemoveOpen(true)}>
              {isInvite ? 'Remove invitation' : 'Remove member'}
            </DropdownMenuItem>
          </Track>
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen && <EditMemberDialog member={member} handleClose={() => setEditOpen(false)} />}
      {removeOpen && (
        <RemoveMemberDialog
          userId={member.user.id}
          memberName={getMemberDisplayName(member)}
          handleClose={() => setRemoveOpen(false)}
          isInvite={isInvite}
        />
      )}
    </>
  )
}

export default MemberRowActionsMenu
