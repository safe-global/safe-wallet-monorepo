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
       * Spans the rule past the parent's horizontal padding; the value names the padding it cancels.
       * The width must live here rather than at the call site: `w-full` above carries a
       * `data-[orientation=…]` prefix, so it outranks any plain utility (0-2-0 vs 0-1-0).
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
