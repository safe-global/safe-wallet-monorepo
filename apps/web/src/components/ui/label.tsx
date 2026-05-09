import * as React from 'react'

import { cn } from '@/utils/cn'

/**
 * Label Component
 *
 * Displays a label for a form control (accessible, links to control via htmlFor).
 *
 * @see https://ui.shadcn.com/docs/components/base/label
 *
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" />
 * ```
 *
 * @remarks
 * Key Props:
 * - `htmlFor`, `className` — see Base UI
 */

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn(
        'gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
