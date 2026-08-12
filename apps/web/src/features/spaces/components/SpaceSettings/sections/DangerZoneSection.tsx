import { useState } from 'react'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin, useIsActiveMember, useIsLastActiveAdmin } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import DeleteSpaceDialog from '../DeleteSpaceDialog'
import LeaveSpaceDialog from '../LeaveSpaceDialog'
import SpaceSettingsSection, { SpaceSettingsSectionTitle } from '../SpaceSettingsSection'

const DangerZoneSection = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const isAdmin = useIsAdmin(space?.uuid)
  const isActiveMember = useIsActiveMember(space?.uuid)
  const isLastActiveAdmin = useIsLastActiveAdmin()

  return (
    <SpaceSettingsSection>
      <SpaceSettingsSectionTitle>Manage workspace</SpaceSettingsSectionTitle>

      <div
        className={cn('flex items-center justify-start gap-6 py-4 first:pt-0', isAdmin && 'border-b border-border/60')}
      >
        {isLastActiveAdmin ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span tabIndex={0}>
                  <Button variant="destructive" data-testid="space-leave-button" disabled>
                    Leave workspace
                  </Button>
                </span>
              }
            />
            <TooltipContent side="top">You are the last active admin and cannot leave the workspace.</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="destructive"
            data-testid="space-leave-button"
            disabled={!isActiveMember}
            onClick={() => {
              setLeaveOpen(true)
              trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
            }}
          >
            Leave workspace
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center justify-start gap-6 py-4 last:pb-0">
          <Button
            variant="destructive"
            data-testid="space-delete-button"
            onClick={() => {
              setDeleteOpen(true)
              trackEvent({ ...SPACE_EVENTS.DELETE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
            }}
          >
            Delete workspace
          </Button>
        </div>
      )}

      {deleteOpen && <DeleteSpaceDialog space={space} onClose={() => setDeleteOpen(false)} />}
      {leaveOpen && <LeaveSpaceDialog space={space} onClose={() => setLeaveOpen(false)} />}
    </SpaceSettingsSection>
  )
}

export default DangerZoneSection
