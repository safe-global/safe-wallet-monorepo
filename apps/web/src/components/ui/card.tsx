import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Card Component
 *
 * Displays a card with header, content, and footer.
 *
 * @see https://ui.shadcn.com/docs/components/base/card
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent><p>Content</p></CardContent>
 *   <CardFooter><p>Footer</p></CardFooter>
 * </Card>
 * ```
 *
 * @remarks
 * Key Props:
 * - Card: `as`, `size` ('default' | 'sm' | 'lg' | 'none'), `variant` ('default' | 'outlined' | 'muted'),
 *   `radius` ('lg' | 'xl' | 'none', default 'lg'), `className` (layout-only: w-*, margins, flex/grid)
 * - CardHeader / CardTitle / CardDescription / CardAction / CardContent / CardFooter: `className`
 *
 * `className` is layout-only. Padding, gap, radius, background and borders belong to `size`/`variant`/`radius`.
 * The Card-family ESLint guard enforces this.
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/?node-id=179:29234
 *
 * Intentional differences from Figma:
 * - gap-6/gap-4: Figma has no gap (slots handle spacing), code adds default for DX
 * - py-6/py-4: Figma has no padding, code adds default for DX
 *
 * Changelog:
 * - 2026-01-29: Removed shadow-xs and ring-1 to match Figma (no elevation/border)
 * - 2026-07-10: Added `size="lg"` (gap-8/py-8, slot px-8); flipped the default `radius` xl→lg (8px, MUI parity)
 */
const cardVariants = cva(
  'bg-card text-card-foreground overflow-hidden text-sm has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col',
  {
    variants: {
      variant: {
        default: '',
        outlined: 'border border-border',
        muted: 'bg-muted',
      },
      size: {
        default: 'gap-6 py-6',
        sm: 'gap-4 py-4',
        lg: 'gap-8 py-8',
        none: 'gap-0 py-0',
      },
      radius: {
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      radius: 'lg',
    },
  },
)

type CardProps<TElement extends React.ElementType = 'div'> = {
  as?: TElement
} & VariantProps<typeof cardVariants> &
  Omit<React.ComponentPropsWithoutRef<TElement>, 'as' | keyof VariantProps<typeof cardVariants>>

function Card<TElement extends React.ElementType = 'div'>({
  as,
  className,
  size = 'default',
  variant = 'default',
  radius = 'lg',
  ...props
}: CardProps<TElement>) {
  const Component = as ?? 'div'

  return (
    <Component
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-radius={radius}
      className={cn(cardVariants({ size, variant, radius }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'gap-1 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 group-data-[size=lg]/card:px-8 group-data-[size=none]/card:px-0 [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4 group-data-[size=lg]/card:[.border-b]:pb-8 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-base leading-normal font-medium group-data-[size=sm]/card:text-sm', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-muted-foreground text-sm', className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        'px-6 group-data-[size=sm]/card:px-4 group-data-[size=lg]/card:px-8 group-data-[size=none]/card:px-0',
        className,
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'rounded-b-xl px-6 group-data-[size=sm]/card:px-4 group-data-[size=lg]/card:px-8 group-data-[size=none]/card:px-0 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4 group-data-[size=lg]/card:[.border-t]:pt-8 flex items-center',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
