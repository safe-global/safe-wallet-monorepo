import type { ReactElement } from 'react'

import { Typography } from '@safe-global/views/components/ui/typography'

import { BalanceBars } from '../BalanceBars'
import type { ReportBar } from '../types'

export const BalanceSummaryCard = ({
  total,
  bars,
  onSelectBar,
}: {
  total: string
  bars: ReportBar[]
  onSelectBar: (id: string) => void
}): ReactElement => (
  <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6 rounded-xl bg-card px-6 pt-5 pb-3">
    <div className="flex flex-col gap-2 pb-3">
      <Typography variant="paragraph-small" color="muted">
        Total balance
      </Typography>
      <Typography variant="h2">{total}</Typography>
    </div>
    <BalanceBars bars={bars} onSelect={onSelectBar} />
  </div>
)
