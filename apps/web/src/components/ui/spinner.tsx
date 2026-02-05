import * as React from 'react'

import { cn } from '@/utils/cn'
import { Loader2Icon } from 'lucide-react'

/**
 * Spinner Component
 *
 * Loading spinner (animated icon).
 *
 * @see https://ui.shadcn.com/docs/components/base/spinner
 *
 * @example
 * ```tsx
 * <Spinner /> or <Spinner className="size-6" />
 * ```
 *
 * @remarks
 * Key Props:
 * - `className` — see Base UI
 */

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return <Loader2Icon role="status" aria-label="Loading" className={cn('size-4 animate-spin', className)} {...props} />
}

export { Spinner }
