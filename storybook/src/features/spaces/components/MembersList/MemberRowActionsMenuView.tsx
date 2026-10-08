import type { ReactNode } from 'react'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'

export type MemberRowActionsMenuViewProps = {
  disabled: boolean
  editDisabled: boolean
  isInvite: boolean
  canRenew: boolean
  isRenewing: boolean
  renewMixpanelParams: Record<string, string>
  onEdit: () => void
  onRenew: () => void
  onRemove: () => void
  editDialog?: ReactNode
  removeDialog?: ReactNode
}

/** Mobile-only kebab that collapses the per-row member actions (edit / renew / remove) into one menu. */
export const MemberRowActionsMenuView = ({
  disabled,
  editDisabled,
  isInvite,
  canRenew,
  isRenewing,
  renewMixpanelParams,
  onEdit,
  onRenew,
  onRemove,
  editDialog,
  removeDialog,
}: MemberRowActionsMenuViewProps) => {
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
            <DropdownMenuItem disabled={editDisabled} onClick={onEdit}>
              Edit member
            </DropdownMenuItem>
          )}
          {canRenew && (
            <Track
              {...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_RENEWED}
              label={SPACE_LABELS.invite_list}
              mixpanelParams={renewMixpanelParams}
            >
              <DropdownMenuItem disabled={isRenewing} onClick={onRenew}>
                Renew invitation
              </DropdownMenuItem>
            </Track>
          )}
          <Track
            {...SPACE_EVENTS.REMOVE_MEMBER_MODAL}
            label={isInvite ? SPACE_LABELS.invite_list : SPACE_LABELS.member_list}
          >
            <DropdownMenuItem variant="destructive" disabled={disabled} onClick={onRemove}>
              {isInvite ? 'Remove invitation' : 'Remove member'}
            </DropdownMenuItem>
          </Track>
        </DropdownMenuContent>
      </DropdownMenu>

      {editDialog}
      {removeDialog}
    </>
  )
}
