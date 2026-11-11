import type { ReactElement } from 'react'
import { Lock } from 'lucide-react'
import { Typography } from '@safe-global/views/components/ui/typography'

export type GasParamsSummaryProps = {
  rows: { label: string; value: string }[]
  /** Why the values can't be changed. */
  note: string
}

export const GasParamsSummary = ({ rows, note }: GasParamsSummaryProps): ReactElement => (
  <div className="flex flex-col gap-3 pt-1 pb-3" data-testid="gas-params-summary">
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <Typography variant="paragraph-small" color="muted">
            {row.label}
          </Typography>
          <Typography variant="paragraph-small">{row.value}</Typography>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-1.5">
      <Lock className="size-3.5 shrink-0 text-muted-foreground" />
      <Typography variant="paragraph-mini" color="muted">
        {note}
      </Typography>
    </div>
  </div>
)
