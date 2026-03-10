import * as React from 'react'

import { cn } from '@/utils/cn'

/**
 * Skeleton Component
 *
 * Placeholder for loading content (pulse animation).
 *
 * @see https://ui.shadcn.com/docs/components/base/skeleton
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />
 * ```
 *
 * @remarks
 * Key Props:
 * - `className` — see Base UI
 */

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('bg-muted rounded-md animate-pulse', className)} {...props} />
}

export { Skeleton }
