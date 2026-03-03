'use client'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'

import { cn } from '@/utils/cn'

/**
 * Separator Component
 *
 * Visual divider (horizontal or vertical line).
 *
 * @see https://ui.shadcn.com/docs/components/base/separator
 *
 * @example
 * ```tsx
 * <Separator /> or <Separator orientation="vertical" />
 * ```
 *
 * @remarks
 * Key Props:
 * - `orientation` ('horizontal' | 'vertical')
 * - `className` — see Base UI
 */

function Separator({ className, orientation = 'horizontal', ...props }: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
