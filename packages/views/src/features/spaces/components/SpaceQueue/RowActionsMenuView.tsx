import type { ReactElement, ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'

export type TrackedRowAction = 'replace' | 'reject'

// Disabled items ignore the pointer, so the wrapper holds the tooltip
const WithReason = ({ reason, children }: { reason?: string; children: ReactElement }): ReactElement => {
  if (!reason) return children
  return (
    <Tooltip delay={QUEUE_TOOLTIP_DELAY}>
      <TooltipTrigger render={<div />}>{children}</TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs whitespace-normal">
        {reason}
      </TooltipContent>
    </Tooltip>
  )
}

type RowDeleteMenuItemProps = {
  /** Absent while the item is disabled */
  onDelete?: () => void
  disabledReason?: string
}

export const RowDeleteMenuItem = ({ onDelete, disabledReason }: RowDeleteMenuItemProps): ReactElement => (
  <>
    <DropdownMenuSeparator />
    <WithReason reason={onDelete ? undefined : disabledReason}>
      <DropdownMenuItem disabled={!onDelete} onClick={onDelete}>
        Delete from queue
      </DropdownMenuItem>
    </WithReason>
  </>
)

type RowActionsMenuViewProps = {
  nonce?: number
  canReplace: boolean
  canReject: boolean
  replaceDisabledReason?: string
  rejectDisabledReason?: string
  link?: string
  /** Rendered only while the menu is open, e.g. a RowDeleteMenuItem */
  deleteItem?: ReactNode
  onReplace: () => void
  onReject: () => void
  onCopyLink: () => void
  wrapItem?: (action: TrackedRowAction, item: ReactElement) => ReactElement
}

const RowActionsMenuView = ({
  nonce,
  canReplace,
  canReject,
  replaceDisabledReason,
  rejectDisabledReason,
  link,
  deleteItem,
  onReplace,
  onReject,
  onCopyLink,
  wrapItem = (_action, item) => item,
}: RowActionsMenuViewProps): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={<Button variant="ghost" size="icon-xs" aria-label={`More actions for #${nonce ?? ''}`} />}
    >
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <WithReason reason={canReplace ? undefined : replaceDisabledReason}>
        {wrapItem(
          'replace',
          <DropdownMenuItem disabled={!canReplace} onClick={onReplace}>
            Replace with a transfer
          </DropdownMenuItem>,
        )}
      </WithReason>
      <WithReason reason={canReject ? undefined : rejectDisabledReason}>
        {wrapItem(
          'reject',
          <DropdownMenuItem disabled={!canReject} onClick={onReject}>
            Reject
          </DropdownMenuItem>,
        )}
      </WithReason>
      <DropdownMenuItem disabled={!link} onClick={onCopyLink}>
        Copy link
      </DropdownMenuItem>
      {deleteItem}
    </DropdownMenuContent>
  </DropdownMenu>
)

export default RowActionsMenuView
