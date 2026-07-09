import { useRef, useState, type HTMLAttributes } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { typographyVariants } from '@/components/ui/typography'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

type TruncatedTextProps = {
  text: string
  className?: string
} & Pick<VariantProps<typeof typographyVariants>, 'variant' | 'color'> &
  Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'>

// Only reveal on a deliberate hover dwell, never instantly while the cursor passes through.
const OPEN_DELAY_MS = 450

type Measurable = Pick<HTMLElement, 'scrollWidth' | 'clientWidth'>

/**
 * Whether the tooltip should open: only on a hover dwell (never on focus, which would pop after a
 * rename restores focus to the trigger), and only when the text is actually clipped. Measured
 * lazily at open time, so no standing resize observation is needed.
 */
export const shouldOpenTooltip = (
  requestedOpen: boolean,
  reason: string | undefined,
  el: Measurable | null,
): boolean => {
  if (!requestedOpen || reason === 'trigger-focus') return false
  return el !== null && el.scrollWidth > el.clientWidth
}

/**
 * Single-line text that ellipsizes (CSS `truncate`) to fit its container and reveals the full value
 * in a tooltip — but only when the text is actually clipped, so short names that already fit don't
 * get a redundant tooltip.
 *
 * The tooltip is hover-only and click-through so it never traps neighbouring controls (e.g. the copy
 * button that sits directly beneath the name): it ignores focus-triggered opens and the popup is
 * pointer-events-none.
 */
function TruncatedText({ text, variant, color, className, ...rest }: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  return (
    <Tooltip
      delay={OPEN_DELAY_MS}
      open={open}
      onOpenChange={(nextOpen, details) => setOpen(shouldOpenTooltip(nextOpen, details.reason, ref.current))}
      disableHoverablePopup
    >
      <TooltipTrigger
        render={
          <span ref={ref} className={cn(typographyVariants({ variant, color }), 'truncate', className)} {...rest}>
            {text}
          </span>
        }
      />
      <TooltipContent className="pointer-events-none">{text}</TooltipContent>
    </Tooltip>
  )
}

export default TruncatedText
