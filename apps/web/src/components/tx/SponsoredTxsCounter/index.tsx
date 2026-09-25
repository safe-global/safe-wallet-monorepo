import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

/** "Nov 1, 00:00 UTC": the reset moment of a sponsored-transactions cycle, always in UTC so every member reads the same. */
export const _formatResetsAt = (iso: string | null): string | null => {
  if (!iso) return null
  const timestamp = Date.parse(iso)
  if (Number.isNaN(timestamp)) return null
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(timestamp)
  return `${formatted} UTC`
}

const SponsoredTxsCounter = ({
  left,
  quota,
  resetsAt,
  isPro,
}: {
  /** Null reads as unlimited. */
  left: number | null
  quota: number | null
  resetsAt: string | null
  isPro: boolean
}): ReactElement => {
  const resets = _formatResetsAt(resetsAt)

  return (
    <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2" data-testid="sponsored-txs-counter">
      <Typography variant="paragraph-small" className="flex flex-wrap items-baseline gap-1">
        {left === null ? (
          <span>Unlimited sponsored transactions</span>
        ) : isPro && quota !== null ? (
          <span>
            <span className="font-semibold" data-testid="sponsored-txs-left">
              {left}
            </span>
            <span className="text-muted-foreground"> of {quota} sponsored transactions left</span>
          </span>
        ) : (
          <span data-testid="sponsored-txs-left">{left} sponsored transactions left</span>
        )}
        {resets && <span className="text-xs text-muted-foreground">· Resets {resets}</span>}
      </Typography>

      {isPro ? (
        <span className="block h-5 w-8 shrink-0" role="img" aria-label="Safe Pro">
          <ProChip className="size-full" />
        </span>
      ) : (
        <Button
          variant="outline"
          size="xs"
          className="shrink-0"
          render={<NextLink href={AppRoutes.welcome.spaces} />}
          data-testid="sponsored-txs-upgrade"
        >
          Upgrade to
          <span className="block h-4 w-6" aria-label="Safe Pro">
            <ProChip className="size-full" />
          </span>
          <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
        </Button>
      )}
    </div>
  )
}

export default SponsoredTxsCounter
