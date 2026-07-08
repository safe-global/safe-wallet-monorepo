import { type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { TOOLTIP_DELAY_MS } from '../utils'

const TRIGGER_CLASS = 'shrink-0 rounded p-0.5 hover:bg-muted transition-colors cursor-pointer inline-flex'

// pointerdown is stopped so the surrounding SelectItem / trigger doesn't select the safe or toggle the
// dropdown. preventDefault on pointerdown does not cancel the synthetic click, so the action still runs
// (span buttons) or the anchor still navigates.
const stopParent = (e: MouseEvent | PointerEvent) => {
  e.stopPropagation()
  e.preventDefault()
}

type RowIconActionProps = {
  label: string
  tooltip?: ReactNode
  testId?: string
  className?: string
  /** When set the trigger is an anchor that opens in a new tab; otherwise it's a keyboard-accessible button. */
  href?: string
  onActivate?: () => void
  children: ReactNode
}

const RowIconAction = ({
  label,
  tooltip = label,
  testId,
  className,
  href,
  onActivate,
  children,
}: RowIconActionProps) => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (!href) e.preventDefault()
    onActivate?.()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (href || (e.key !== 'Enter' && e.key !== ' ')) return
    e.stopPropagation()
    e.preventDefault()
    onActivate?.()
  }

  const trigger = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      onPointerDown={stopParent}
      className={cn(TRIGGER_CLASS, className)}
      aria-label={label}
      data-testid={testId}
    />
  ) : (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onPointerDown={stopParent}
      onKeyDown={handleKeyDown}
      className={cn(TRIGGER_CLASS, className)}
      aria-label={label}
      data-testid={testId}
    />
  )

  return (
    <Tooltip delay={TOOLTIP_DELAY_MS} disableHoverablePopup>
      <TooltipTrigger render={trigger}>{children}</TooltipTrigger>
      <TooltipContent className="pointer-events-none select-none">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

export default RowIconAction
