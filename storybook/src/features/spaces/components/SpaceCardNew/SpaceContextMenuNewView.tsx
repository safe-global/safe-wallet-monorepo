import type { MouseEvent, ReactNode } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type SpaceContextMenuNewViewProps = {
  isMenuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  isDeletionBlocked: boolean
  blockedReason?: string
  onRename: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
  dialogs: ReactNode
}

export function SpaceContextMenuNewView({
  isMenuOpen,
  onMenuOpenChange,
  isDeletionBlocked,
  blockedReason,
  onRename,
  onRemove,
  dialogs,
}: SpaceContextMenuNewViewProps) {
  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
          }
        >
          <MoreVertical className="size-4 text-[var(--color-border-main)]" />
          <span className="sr-only">Workspace actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => onRename(e)} onSelect={(e) => e.stopPropagation()}>
            <Pencil className="text-success" />
            <span>Rename</span>
          </DropdownMenuItem>

          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Track {...SPACE_EVENTS.DELETE_SPACE_MODAL} label={SPACE_LABELS.space_context_menu}>
                <DropdownMenuItem
                  data-testid="remove-button-spaces-new"
                  disabled={isDeletionBlocked}
                  onClick={isDeletionBlocked ? undefined : (e) => onRemove(e)}
                  onSelect={(e) => e.stopPropagation()}
                  variant="destructive"
                >
                  <Trash2 />
                  <span>Remove</span>
                </DropdownMenuItem>
              </Track>
            </TooltipTrigger>
            {blockedReason && <TooltipContent side="left">{blockedReason}</TooltipContent>}
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogs}
    </>
  )
}
