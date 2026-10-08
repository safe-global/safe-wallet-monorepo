import { useState } from 'react'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin, useIsActiveMember, useIsLastActiveAdmin, useSpaceDeletionGuard } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import DeleteSpaceDialog from '../DeleteSpaceDialog'
import LeaveSpaceDialog from '../LeaveSpaceDialog'
import { DangerZoneSectionView } from '@views/features/spaces/components/SpaceSettings/sections/DangerZoneSectionView'

const DangerZoneSection = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const isAdmin = useIsAdmin(space?.uuid)
  const isActiveMember = useIsActiveMember(space?.uuid)
  const isLastActiveAdmin = useIsLastActiveAdmin()
  const { isDeletionBlocked, blockedReason } = useSpaceDeletionGuard(isAdmin ? (space?.uuid ?? null) : null)

  return (
    <DangerZoneSectionView
      isAdmin={isAdmin}
      isActiveMember={isActiveMember}
      isLastActiveAdmin={isLastActiveAdmin}
      isDeletionBlocked={isDeletionBlocked}
      blockedReason={blockedReason}
      onDelete={() => {
        setDeleteOpen(true)
        trackEvent({ ...SPACE_EVENTS.DELETE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
      }}
      onLeave={() => {
        setLeaveOpen(true)
        trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
      }}
      dialogs={
        <>
          {deleteOpen && <DeleteSpaceDialog space={space} onClose={() => setDeleteOpen(false)} />}
          {leaveOpen && <LeaveSpaceDialog space={space} onClose={() => setLeaveOpen(false)} />}
        </>
      }
    />
  )
}

export default DangerZoneSection
