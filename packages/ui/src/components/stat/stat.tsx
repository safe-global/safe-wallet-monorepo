import type { ComponentProps, HTMLAttributes, ReactNode } from 'react'
import { Skeleton } from '../../primitives/skeleton/skeleton'
import { Typography } from '../../primitives/typography/typography'
import { cn } from '../../lib/utils'

/**
 * Stat
 *
 * A muted label above a large bold value, with a skeleton while the value loads.
 *
 * @example
 * ```tsx
 * <Stat label="Total value" value="$123,456.01" loading={isLoading} />
 * ```
 */
interface StatProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: ReactNode
  value: ReactNode
  /** Shows a skeleton instead of the value */
  loading?: boolean
  /** Props for the value element, e.g. a `data-testid` */
  valueProps?: Omit<HTMLAttributes<HTMLElement>, 'color'> & { [attribute: `data-${string}`]: string | undefined }
}

function Stat({ label, value, loading = false, valueProps, className, ...props }: StatProps) {
  return (
    <div data-slot="stat" className={cn('flex flex-col gap-1', className)} {...props}>
      <Typography variant="paragraph-mini-medium" color="muted">
        {label}
      </Typography>
      {loading ? (
        <Skeleton className="h-[30px] w-48" />
      ) : (
        <Typography
          variant="h2"
          {...valueProps}
          className={cn('font-bold leading-[1] tracking-tight', valueProps?.className)}
        >
          {value}
        </Typography>
      )}
    </div>
  )
}

export { Stat }
export type { StatProps }
