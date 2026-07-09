import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

/**
 * ActionBar — lays out a row of action-bar buttons with one consistent gap and
 * responsive wrapping. Put `<ActionButton>`s inside it. Owns the layout so call
 * sites never hand-roll flex/gap for a CTA row.
 */
const ActionBar = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
)

// Closed preset: `size` and `className` are intentionally NOT accepted so the
// action-pill identity can't be overridden. Layout is a semantic prop
// (`fullWidth`); `variant` carries the emphasis.
type ActionButtonProps = Omit<ComponentProps<typeof Button>, 'size' | 'className'> & {
  /** Stretch to the container width (e.g. stacked-mobile CTA row). */
  fullWidth?: boolean
}

/**
 * ActionButton — a Button locked to the prominent `size="action"` CTA pill
 * (h-10, px-6). The `variant` carries the emphasis: `default` for the one
 * primary action, `secondary` (white/card surfaces) or `outline` (page/toolbar
 * backgrounds) for the rest. It does not take a styling `className`.
 */
const ActionButton = ({ fullWidth = false, ...props }: ActionButtonProps) => (
  <Button size="action" {...props} className={cn(fullWidth && 'w-full')} />
)

export { ActionBar, ActionButton }
