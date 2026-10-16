'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@safe-global/views/utils/cn'

/**
 * ButtonGroup Component
 *
 * Joins adjacent buttons into one segmented control: inner corners are squared and the shared
 * borders collapse. Children must be the buttons themselves (no wrapper elements), or the
 * first/last-child selectors miss.
 *
 * @see https://ui.shadcn.com/docs/components/base/button-group
 *
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <Button variant="outline">Import</Button>
 *   <Button variant="outline">Export</Button>
 * </ButtonGroup>
 * ```
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none',
        vertical:
          'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation ?? 'horizontal'}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

export { ButtonGroup, buttonGroupVariants }
