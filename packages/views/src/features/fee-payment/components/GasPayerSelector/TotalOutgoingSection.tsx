import type { ReactElement } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { TotalOutgoingView } from '@safe-global/views/features/fee-payment/types'
import css from './styles.module.css'

export const TotalOutgoingSection = ({ totalOutgoing }: { totalOutgoing: TotalOutgoingView }): ReactElement => (
  <div className={css.totalOutgoing}>
    <Typography variant="paragraph-small-bold">Total outgoing</Typography>
    <div className={css.totalOutgoingValue}>
      {totalOutgoing.primary.map((line) => (
        <Typography key={line.currency} variant="paragraph-small-bold">
          {line.amount} {line.currency}
        </Typography>
      ))}
      {totalOutgoing.fees && (
        <Typography variant="paragraph-small-bold">
          {totalOutgoing.fees.amount} {totalOutgoing.fees.currency}
        </Typography>
      )}
      <Typography variant="paragraph-mini" color="muted">
        {totalOutgoing.fiatTotal}
      </Typography>
    </div>
  </div>
)
