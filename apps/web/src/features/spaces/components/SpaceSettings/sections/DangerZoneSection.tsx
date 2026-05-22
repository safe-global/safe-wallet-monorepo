import { useState } from 'react'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin, useIsActiveMember, useIsLastActiveAdmin } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import DeleteSpaceDialog from '../DeleteSpaceDialog'
import LeaveSpaceDialog from '../LeaveSpaceDialog'

const DangerZoneSection = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const isAdmin = useIsAdmin(space?.id)
  const isActiveMember = useIsActiveMember(space?.id)
  const isLastActiveAdmin = useIsLastActiveAdmin()

  return (
    <section className="bg-card rounded-2xl p-6 mb-3">
      <Typography variant="paragraph-bold" className="mb-5 block tracking-tight">
        Manage workspace
      </Typography>

      <div
        className={cn(
          'flex items-center justify-between gap-6 py-4 first:pt-0',
          isAdmin && 'border-b border-border/60',
        )}
      >
        <Typography variant="paragraph-small-bold" className="flex-1 min-w-0">
          Leave this workspace
        </Typography>
        {isLastActiveAdmin ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span tabIndex={0}>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="space-leave-button"
                    disabled
                    className="text-destructive"
                  >
                    Leave workspace
                  </Button>
                </span>
              }
            />
            <TooltipContent side="top">You are the last active admin and cannot leave the workspace.</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            data-testid="space-leave-button"
            disabled={!isActiveMember}
            onClick={() => {
              setLeaveOpen(true)
              trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
            }}
            className="text-destructive"
          >
            Leave workspace
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center justify-between gap-6 py-4 last:pb-0">
          <Typography variant="paragraph-small-bold" className="flex-1 min-w-0">
            Delete workspace
          </Typography>
          <Button
            variant="destructive"
            size="sm"
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
    </section>
  )
}

export default DangerZoneSection
