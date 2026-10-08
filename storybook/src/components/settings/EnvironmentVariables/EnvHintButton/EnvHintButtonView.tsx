import { type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type EnvHintButtonViewProps = {
  buttonClassName?: string
  onNavigate: () => void
}

export const EnvHintButtonView = ({ buttonClassName, onNavigate }: EnvHintButtonViewProps) => {
  const handlePointer = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onNavigate()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    e.preventDefault()
    onNavigate()
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            role="button"
            tabIndex={0}
            aria-label="Default environment has been changed"
            onClick={handlePointer}
            onPointerDown={handlePointer}
            onKeyDown={handleKeyDown}
            className={cn(
              'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50',
              buttonClassName,
            )}
            style={{ backgroundColor: 'var(--color-warning-background)', color: 'var(--color-warning-main)' }}
          />
        }
      >
        <TriangleAlert className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Default environment has been changed</TooltipContent>
    </Tooltip>
  )
}
