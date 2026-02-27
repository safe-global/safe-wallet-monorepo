import * as React from 'react'

import { cn } from '@/utils/cn'
import { ChevronDownIcon } from 'lucide-react'

/**
 * Native Select Component
 *
 * Native HTML select with styled wrapper and optional size.
 *
 * @see https://ui.shadcn.com/docs/components/base/native-select
 *
 * @example
 * ```tsx
 * <NativeSelect>
 *   <NativeSelectOption value="a">Option A</NativeSelectOption>
 *   <NativeSelectOption value="b">Option B</NativeSelectOption>
 * </NativeSelect>
 * ```
 *
 * @remarks
 * Key Props:
 * - NativeSelect: `size` ('sm' | 'default'), `className`
 * - NativeSelectOption / NativeSelectOptGroup: native option/optgroup props
 */

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default'
}

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn('group/native-select relative w-fit has-[select:disabled]:opacity-50', className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 w-full min-w-0 appearance-none rounded-md border bg-transparent py-1 pr-8 pl-2.5 text-sm shadow-xs transition-[color,box-shadow] select-none focus-visible:ring-[3px] aria-invalid:ring-[3px] data-[size=sm]:h-8 outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
        {...props}
      />
      <ChevronDownIcon
        className="text-muted-foreground top-1/2 right-2.5 size-4 -translate-y-1/2 pointer-events-none absolute select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ ...props }: React.ComponentProps<'option'>) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return <optgroup data-slot="native-select-optgroup" className={cn(className)} {...props} />
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
