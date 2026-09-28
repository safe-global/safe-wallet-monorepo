import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const ARROW_EASE = 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'

/**
 * The CTA arrow answers the hovered or focused `group/plan` card: on the filled button it nudges forward; on an outlined one it
 * slides in, the negative margin cancelling the button gap so the label stays centred at rest. Sales links open a
 * new tab, so they point up and out.
 */
export const CtaArrow = ({ variant, external }: { variant: 'nudge' | 'reveal'; external?: boolean }) => {
  const Icon = external ? ArrowUpRight : ArrowRight
  if (variant === 'nudge') {
    return (
      <Icon
        data-icon="inline-end"
        data-cta-arrow="nudge"
        className={cn(
          'transition-transform group-hover/plan:translate-x-0.5 group-focus-within/plan:translate-x-0.5',
          ARROW_EASE,
        )}
      />
    )
  }
  return (
    <span
      aria-hidden
      data-cta-arrow="reveal"
      className={cn(
        '-ml-1.5 inline-flex w-0 overflow-hidden opacity-0 transition-[width,margin,opacity]',
        'group-hover/plan:ml-0 group-hover/plan:w-4 group-hover/plan:opacity-100',
        'group-focus-within/plan:ml-0 group-focus-within/plan:w-4 group-focus-within/plan:opacity-100',
        ARROW_EASE,
      )}
    >
      <Icon
        className={cn(
          '-translate-x-1 transition-transform group-hover/plan:translate-x-0 group-focus-within/plan:translate-x-0',
          ARROW_EASE,
        )}
      />
    </span>
  )
}
