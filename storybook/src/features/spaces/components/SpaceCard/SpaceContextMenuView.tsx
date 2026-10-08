import type { MouseEvent, ReactNode } from 'react'
import { Download, EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'

export type SpaceContextMenuViewProps = {
  isMenuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  isDeletionBlocked: boolean
  blockedReason?: string
  isDownloading: boolean
  onRename: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
  onDownload: (e: MouseEvent) => void
  dialogs: ReactNode
}

export function SpaceContextMenuView({
  isMenuOpen,
  onMenuOpenChange,
  isDeletionBlocked,
  blockedReason,
  isDownloading,
  onRename,
  onRemove,
  onDownload,
  dialogs,
}: SpaceContextMenuViewProps) {
  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
              aria-label="Open space actions"
              data-testid="space-card-context-menu-button"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => onRename(e)}>
            <EditIcon className="text-[var(--color-success-main)]" />
            <span>Rename</span>
          </DropdownMenuItem>

          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Track {...SPACE_EVENTS.DELETE_SPACE_MODAL} label={SPACE_LABELS.space_context_menu}>
                <DropdownMenuItem
                  data-testid="remove-button"
                  disabled={isDeletionBlocked}
                  onClick={isDeletionBlocked ? undefined : (e) => onRemove(e)}
                >
                  <DeleteIcon className="text-[var(--color-error-main)]" />
                  <span>Remove</span>
                </DropdownMenuItem>
              </Track>
            </TooltipTrigger>
            {blockedReason && <TooltipContent side="left">{blockedReason}</TooltipContent>}
          </Tooltip>

          <Track {...SPACE_EVENTS.EXPORT_ADDRESS_BOOK} label={SPACE_LABELS.space_context_menu}>
            <DropdownMenuItem data-testid="download-address-book-button" disabled={isDownloading} onClick={onDownload}>
              <Download className="text-muted-foreground" />
              <span>Download shared address book</span>
            </DropdownMenuItem>
          </Track>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogs}
    </>
  )
}
