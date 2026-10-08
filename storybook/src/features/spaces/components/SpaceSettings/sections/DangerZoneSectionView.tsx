import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

export type DangerZoneSectionViewProps = {
  isAdmin: boolean
  isActiveMember: boolean
  isLastActiveAdmin: boolean
  isDeletionBlocked: boolean
  blockedReason?: string
  onDelete: () => void
  onLeave: () => void
  dialogs: ReactNode
}

export const DangerZoneSectionView = ({
  isAdmin,
  isActiveMember,
  isLastActiveAdmin,
  isDeletionBlocked,
  blockedReason,
  onDelete,
  onLeave,
  dialogs,
}: DangerZoneSectionViewProps) => {
  const deleteButton = (
    <Button variant="destructive" data-testid="space-delete-button" disabled={isDeletionBlocked} onClick={onDelete}>
      Delete Workspace
    </Button>
  )

  return (
    <SpaceSettingsSection>
      <SpaceSettingsSectionTitle>Manage Workspace</SpaceSettingsSectionTitle>

      <div
        className={cn('flex items-center justify-start gap-6 py-4 first:pt-0', isAdmin && 'border-b border-border/60')}
      >
        {isLastActiveAdmin ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span tabIndex={0}>
                  <Button variant="destructive" data-testid="space-leave-button" disabled>
                    Leave Workspace
                  </Button>
                </span>
              }
            />
            <TooltipContent side="top">You are the last active admin and cannot leave the Workspace.</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="destructive" data-testid="space-leave-button" disabled={!isActiveMember} onClick={onLeave}>
            Leave Workspace
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center justify-start gap-6 py-4 last:pb-0">
          {blockedReason ? (
            <Tooltip>
              <TooltipTrigger render={<span tabIndex={0}>{deleteButton}</span>} />
              <TooltipContent side="top" data-testid="space-delete-blocked-tooltip">
                {blockedReason}
              </TooltipContent>
            </Tooltip>
          ) : (
            deleteButton
          )}
        </div>
      )}

      {dialogs}
    </SpaceSettingsSection>
  )
}
