import { useState } from 'react'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin, useIsActiveMember, useIsLastActiveAdmin } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip } from '@mui/material'
import DeleteSpaceDialog from '../DeleteSpaceDialog'
import LeaveSpaceDialog from '../LeaveSpaceDialog'

const DangerZoneSection = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const isAdmin = useIsAdmin()
  const isActiveMember = useIsActiveMember()
  const isLastActiveAdmin = useIsLastActiveAdmin()

  return (
    <section className="bg-card rounded-2xl p-6 mb-4">
      <Typography variant="paragraph-bold" className="mb-4 block">
        Manage workspace
      </Typography>

      <div className="flex items-center justify-between gap-6 py-3 border-b border-border">
        <Typography variant="paragraph-small-bold" className="flex-1 min-w-0">
          Leave this workspace
        </Typography>
        <Tooltip title={isLastActiveAdmin ? 'You are the last active admin and cannot leave the space.' : ''}>
          <span>
            <Button
              variant="outline"
              size="sm"
              data-testid="space-leave-button"
              disabled={isLastActiveAdmin || !isActiveMember}
              onClick={() => {
                setLeaveOpen(true)
                trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE_MODAL, label: SPACE_LABELS.space_settings })
              }}
              className="text-destructive"
            >
              Leave space
            </Button>
          </span>
        </Tooltip>
      </div>

      {isAdmin && (
        <div className="flex items-center justify-between gap-6 pt-3">
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
