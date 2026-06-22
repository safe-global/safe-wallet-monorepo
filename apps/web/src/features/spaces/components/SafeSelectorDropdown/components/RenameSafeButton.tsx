import { type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Pencil } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Mirrors CopyAddressButton: pointerdown stops the surrounding SelectItem / collapsible from
// selecting/expanding; the rename opens on click, so a pointer click opens the dialog exactly once.
const RenameSafeButton = ({ onClick }: { onClick: () => void }) => {
  const stopParent = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onClick()
  }
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    e.preventDefault()
    onClick()
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onPointerDown={stopParent}
            onKeyDown={handleKeyDown}
            className="shrink-0 rounded p-0.5 inline-flex cursor-pointer transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Rename"
            data-testid="rename-safe-btn"
          />
        }
      >
        <Pencil className="size-3" />
      </TooltipTrigger>
      <TooltipContent>Rename</TooltipContent>
    </Tooltip>
  )
}

export default RenameSafeButton
