'use client'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cva, type VariantProps } from 'class-variance-authority'

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
 * <Separator bleed="6" /> // full-bleed across a px-6 container
 * ```
 *
 * @remarks
 * Key Props:
 * - `orientation` ('horizontal' | 'vertical')
 * - `bleed` ('none' | '3' | '4' | '6') — see below
 * - `className` — see Base UI
 */

const separatorVariants = cva(
  'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
  {
    variants: {
      /**
       * Extends a horizontal separator past the parent's horizontal padding so the rule spans the
       * container edge to edge. The value names the padding it cancels: `bleed="6"` for a `px-6`
       * (24px) container, and so on.
       *
       * A bare negative margin is not enough — it only shifts the box, leaving the rule short on
       * the right by twice the padding, so the width has to grow with it. Setting the width from a
       * call-site class does not work either: the base `w-full` carries a `data-[orientation=…]`
       * prefix and outranks a plain utility (0-2-0 vs 0-1-0) whatever the order. That is why the
       * width lives here, as a branch that replaces `w-full` instead of competing with it.
       */
      bleed: {
        none: 'data-[orientation=horizontal]:w-full',
        '3': 'data-[orientation=horizontal]:-mx-3 data-[orientation=horizontal]:w-[calc(100%+(2*(var(--spacing)*3)))]',
        '4': 'data-[orientation=horizontal]:-mx-4 data-[orientation=horizontal]:w-[calc(100%+(2*(var(--spacing)*4)))]',
        '6': 'data-[orientation=horizontal]:-mx-6 data-[orientation=horizontal]:w-[calc(100%+(2*(var(--spacing)*6)))]',
      },
    },
    defaultVariants: {
      bleed: 'none',
    },
  },
)

type SeparatorProps = SeparatorPrimitive.Props & VariantProps<typeof separatorVariants>

function Separator({ className, orientation = 'horizontal', bleed, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(separatorVariants({ bleed }), className)}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
