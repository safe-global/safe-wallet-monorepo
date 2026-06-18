import { useRef, useState, type HTMLAttributes } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { typographyVariants } from '@/components/ui/typography'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { useIsTruncated } from '../hooks/useIsTruncated'

type TruncatedTextProps = {
  text: string
  className?: string
} & Pick<VariantProps<typeof typographyVariants>, 'variant' | 'color'> &
  Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'>

// Only reveal on a deliberate hover dwell, never instantly while the cursor passes through.
const OPEN_DELAY_MS = 450

/**
 * Single-line text that ellipsizes to fit its container and reveals the full
 * value in a tooltip — but only when the text is actually clipped, so short
 * names that already fit don't get a redundant tooltip.
 *
 * The tooltip is hover-only and click-through so it never traps neighbouring
 * controls (e.g. the copy button that sits directly beneath the name): it
 * ignores focus-triggered opens (which would otherwise pop after a rename
 * restores focus to the trigger) and the popup is pointer-events-none.
 */
function TruncatedText({ text, variant, color, className, ...rest }: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isTruncated = useIsTruncated(ref, text)
  const [open, setOpen] = useState(false)

  return (
    <Tooltip
      delay={OPEN_DELAY_MS}
      open={open}
      onOpenChange={(nextOpen, details) => {
        // Suppress focus-triggered opens; allow hover opens and every close.
        if (nextOpen && details.reason === 'trigger-focus') return
        setOpen(nextOpen)
      }}
      disableHoverablePopup
    >
      <TooltipTrigger
        render={
          <span ref={ref} className={cn(typographyVariants({ variant, color }), 'truncate', className)} {...rest}>
            {text}
          </span>
        }
      />
      {isTruncated && <TooltipContent className="pointer-events-none">{text}</TooltipContent>}
    </Tooltip>
  )
}

export default TruncatedText
