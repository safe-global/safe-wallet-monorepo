import NextLink from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { DEFI_V1_COPY, formatCompactUsd } from '../copy'
import { IDLE_CASH, OPPORTUNITIES } from '../opportunities'
import { nudgeOptions } from '../shelf'
import type { DefiV1Config } from '../types'

export const IdleCashNudge = ({ config, placement }: { config: DefiV1Config; placement: 'home' | 'assets' }) => {
  const safeLinkQuery = useSafeLinkQuery()
  const options = nudgeOptions(OPPORTUNITIES, config.model, config.plan)
  const href = { pathname: AppRoutes.earn, query: { ...safeLinkQuery, category: 'cash' } }
  const value = formatCompactUsd(IDLE_CASH.amount)

  if (placement === 'assets') {
    return (
      <div
        className="mt-2 flex flex-col gap-2 rounded-lg bg-muted p-3 sm:flex-row sm:items-center sm:justify-between"
        data-testid="idle-cash-nudge-inline"
      >
        <Typography variant="paragraph-small-medium" className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden />
          {DEFI_V1_COPY.nudgeInline(value, IDLE_CASH.asset, IDLE_CASH.idleDays)} on {IDLE_CASH.chain}
        </Typography>
        <Button variant="outline" size="sm" render={<NextLink href={href} />}>
          {DEFI_V1_COPY.nudgeInlineCta}
          <ArrowRight />
        </Button>
      </div>
    )
  }

  return (
    <Card variant="brand" data-testid="idle-cash-nudge">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-bold">
              {DEFI_V1_COPY.nudgeTitle(value, IDLE_CASH.asset, IDLE_CASH.chain, IDLE_CASH.idleDays)}
            </Typography>
            <Typography variant="paragraph-small" color="muted">
              {DEFI_V1_COPY.nudgeBody(options.length)}
            </Typography>
          </div>
          <Button variant="surface" render={<NextLink href={href} />}>
            {DEFI_V1_COPY.nudgeCta}
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
