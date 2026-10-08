import { useState } from 'react'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import EditMemberDialog from './EditMemberDialog'
import RemoveMemberDialog from './RemoveMemberDialog'
import useRenewInvite from './useRenewInvite'
import { getMemberDisplayName } from '../../hooks/useSpaceMembers'
import { MemberRowActionsMenuView } from '@views/features/spaces/components/MembersList/MemberRowActionsMenuView'

type MemberRowActionsMenuProps = {
  member: MemberDto
  disabled: boolean
  // Edit stays enabled for the current user (to rename themselves) even when remove is disabled.
  editDisabled: boolean
  isInvite: boolean
  canRenew: boolean
}

const MemberRowActionsMenu = ({ member, disabled, editDisabled, isInvite, canRenew }: MemberRowActionsMenuProps) => {
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const { renewInvite, isLoading } = useRenewInvite(member)

  return (
    <MemberRowActionsMenuView
      disabled={disabled}
      editDisabled={editDisabled}
      isInvite={isInvite}
      canRenew={canRenew}
      isRenewing={isLoading}
      renewMixpanelParams={{ [MixpanelEventParams.MEMBER_ROLE]: member.role }}
      onEdit={() => setEditOpen(true)}
      onRenew={() => renewInvite()}
      onRemove={() => setRemoveOpen(true)}
      editDialog={editOpen && <EditMemberDialog member={member} handleClose={() => setEditOpen(false)} />}
      removeDialog={
        removeOpen && (
          <RemoveMemberDialog
            userId={member.user.id}
            memberName={getMemberDisplayName(member)}
            handleClose={() => setRemoveOpen(false)}
            isInvite={isInvite}
          />
        )
      }
    />
  )
}

export default MemberRowActionsMenu
