import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { LogOut, MoreVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type SpaceSafeContextMenuViewProps = {
  isMenuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  canRename: boolean
  /** Why renaming is not allowed, shown while it is disabled. */
  renameDisabledMessage: string
  isAdmin: boolean
  onRename: (event: MouseEvent) => void
  onRemove: (event: MouseEvent) => void
  /** The rename and remove dialogs, when open. */
  dialogs: ReactNode
}

export const SpaceSafeContextMenuView = ({
  isMenuOpen,
  onMenuOpenChange,
  canRename,
  renameDisabledMessage,
  isAdmin,
  onRename,
  onRemove,
  dialogs,
}: SpaceSafeContextMenuViewProps): ReactElement => (
  <>
    <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Safe Account actions"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Tooltip>
          <TooltipTrigger render={<div />}>
            <DropdownMenuItem
              disabled={!canRename}
              title={canRename ? undefined : renameDisabledMessage}
              onClick={canRename ? onRename : undefined}
              onSelect={(e) => e.stopPropagation()}
            >
              <Pencil className="size-4 text-muted-foreground" />
              <span data-testid="space-safe-rename-btn">Rename</span>
            </DropdownMenuItem>
          </TooltipTrigger>
          {!canRename && <TooltipContent>{renameDisabledMessage}</TooltipContent>}
        </Tooltip>

        {isAdmin && (
          <DropdownMenuItem onClick={onRemove} onSelect={(e) => e.stopPropagation()}>
            <LogOut className="size-4 text-muted-foreground" />
            <span>Remove from Workspace</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    {dialogs}
  </>
)
