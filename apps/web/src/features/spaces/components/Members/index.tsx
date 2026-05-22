import { Button as ShadcnButton } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import AddMemberModal from 'src/features/spaces/components/AddMemberModal'
import { useState } from 'react'
import MembersList from '../MembersList'
import { useIsInvited, useSpaceMembersByStatus, useIsAdmin } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const SpaceMembers = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  return (
    <>
      {isInvited && <PreviewInvite />}
      <div className="mb-6 flex flex-col gap-6">
        <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
          Members
        </Typography>
        {isAdmin && (
          <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.members_page}>
            <ShadcnButton
              data-testid="add-member-button"
              size="lg"
              className="font-bold px-4 py-0"
              onClick={() => setOpenAddMembersModal(true)}
            >
              <Plus className="size-4 mr-1 text-green-500" />
              Add member
            </ShadcnButton>
          </Track>
        )}
      </div>
      <>
        {invitedMembers.length > 0 && (
          <>
            <Typography variant="paragraph-bold" className="font-bold mb-4">
              Pending invitations ({invitedMembers.length})
            </Typography>
            <MembersList members={invitedMembers} />
          </>
        )}
        {activeMembers.length > 0 && (
          <>
            <Typography variant="paragraph-bold" className="font-bold mt-2 mb-4">
              All members ({activeMembers.length})
            </Typography>
            <MembersList members={activeMembers} />
          </>
        )}
      </>

      {openAddMembersModal && <AddMemberModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default SpaceMembers
