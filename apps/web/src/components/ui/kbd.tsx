import * as React from 'react'

import { cn } from '@/utils/cn'

/**
 * Kbd Component
 *
 * Displays a keyboard shortcut or key hint.
 *
 * @see https://ui.shadcn.com/docs/components/base/kbd
 *
 * @example
 * ```tsx
 * <Kbd>⌘</Kbd><Kbd>K</Kbd> or <KbdGroup><Kbd>Ctrl</Kbd><Kbd>S</Kbd></KbdGroup>
 * ```
 *
 * @remarks
 * Key Props:
 * - `className`
 * - KbdGroup: for grouping keys — see Base UI
 */

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground [[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10 h-5 w-fit min-w-5 gap-1 rounded-sm px-1 font-sans text-xs font-medium [&_svg:not([class*='size-'])]:size-3 pointer-events-none inline-flex items-center justify-center select-none",
        className,
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <kbd data-slot="kbd-group" className={cn('gap-1 inline-flex items-center', className)} {...props} />
}

export { Kbd, KbdGroup }
