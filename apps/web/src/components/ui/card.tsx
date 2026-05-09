import * as React from 'react'

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
 * - Card: `size` ('default' | 'sm'), `className`
 * - CardHeader / CardTitle / CardDescription / CardAction / CardContent / CardFooter: `className`
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/?node-id=179:29234
 *
 * Intentional differences from Figma:
 * - gap-6/gap-4: Figma has no gap (slots handle spacing), code adds default for DX
 * - py-6/py-4: Figma has no padding, code adds default for DX
 *
 * Changelog:
 * - 2026-01-29: Removed shadow-xs and ring-1 to match Figma (no elevation/border)
 */
function Card({ className, size = 'default', ...props }: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'bg-card text-card-foreground gap-6 overflow-hidden rounded-xl py-6 text-sm has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'gap-1 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
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
  return <div data-slot="card-content" className={cn('px-6 group-data-[size=sm]/card:px-4', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'rounded-b-xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4 flex items-center',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
