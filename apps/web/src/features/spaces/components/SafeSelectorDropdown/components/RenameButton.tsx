import { type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Pencil } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { TOOLTIP_DELAY_MS } from '../utils'

// Opens the rename dialog for a safe row. Rendered inside a SelectItem, so pointerdown is stopped
// from reaching the row (which would otherwise select the safe); the rename runs on click.
const RenameButton = ({ onRename, className }: { onRename: () => void; className?: string }) => {
  // preventDefault on pointerdown does not cancel the synthetic click, so the click still fires.
  const stopParent = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onRename()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    e.preventDefault()
    onRename()
  }

  return (
    <Tooltip delay={TOOLTIP_DELAY_MS} disableHoverablePopup>
      <TooltipTrigger
        render={
          <span
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onPointerDown={stopParent}
            onKeyDown={handleKeyDown}
            className={cn(
              'shrink-0 rounded p-0.5 hover:bg-muted transition-colors cursor-pointer inline-flex',
              className,
            )}
            aria-label="Rename safe"
            data-testid="safe-item-rename-btn"
          />
        }
      >
        <Pencil className="size-3 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none select-none">Rename</TooltipContent>
    </Tooltip>
  )
}

export default RenameButton
