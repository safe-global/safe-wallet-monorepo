import AddMemberModal from '../AddMemberModal'
import { useState } from 'react'
import MembersList from '../MembersList'
import { useIsInvited, useSpaceMembersByStatus, useIsAdmin } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { MembersView } from '@views/features/spaces/components/Members/MembersView'

const SpaceMembers = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  return (
    <MembersView
      previewInvite={isInvited && <PreviewInvite />}
      isAdmin={isAdmin}
      onAddMember={() => setOpenAddMembersModal(true)}
      activeCount={activeMembers.length}
      invitedCount={invitedMembers.length}
      renderMembersList={(variant) => (
        <MembersList members={variant === 'active' ? activeMembers : invitedMembers} variant={variant} />
      )}
      addMemberModal={openAddMembersModal && <AddMemberModal onClose={() => setOpenAddMembersModal(false)} />}
    />
  )
}

export default SpaceMembers
