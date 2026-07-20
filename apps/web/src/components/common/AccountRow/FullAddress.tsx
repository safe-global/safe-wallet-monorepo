import type { ComponentProps, Ref } from 'react'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

/**
 * Full address with emphasised head and tail. The middle segment ellipsizes first when space is
 * short, so the recognisable start and end of the address always stay visible.
 *
 * `middleRef` exposes the truncating middle span so callers can reveal a full-address tooltip only
 * when it is actually clipped.
 */
const FullAddress = ({
  address,
  className,
  middleRef,
  ...props
}: { address: string; className?: string; middleRef?: Ref<HTMLSpanElement> } & Omit<
  ComponentProps<typeof Typography>,
  'variant' | 'color'
>) => (
  <Typography variant="paragraph-mini" color="muted" className={cn('flex min-w-0 font-mono', className)} {...props}>
    <span className="shrink-0 font-semibold text-foreground">{address.slice(0, 5)}</span>
    <span ref={middleRef} className="truncate min-w-0">
      {address.slice(5, -6)}
    </span>
    <span className="shrink-0 font-semibold text-foreground">{address.slice(-6)}</span>
  </Typography>
)

export default FullAddress
