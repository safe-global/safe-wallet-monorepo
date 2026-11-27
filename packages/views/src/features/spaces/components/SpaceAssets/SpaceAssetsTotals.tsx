import type { ReactElement } from 'react'
import { Card } from '@safe-global/views/components/ui/card'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'

type SpaceAssetsTotalsProps = {
  total: string
  tokens: string
  positions: string
  isLoading: boolean
  /** Some networks failed to load, so the totals leave them out */
  isPartial: boolean
}

const Stat = ({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    {isLoading ? (
      <Skeleton className="h-7 w-28" />
    ) : (
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    )}
  </div>
)

/** The value of the shown Safe accounts: in total, in tokens and in positions */
const SpaceAssetsTotals = ({
  total,
  tokens,
  positions,
  isLoading,
  isPartial,
}: SpaceAssetsTotalsProps): ReactElement => (
  <Card size="sm" radius="xl" data-testid="space-assets-totals">
    <div className="flex flex-col gap-4 px-6">
      <div className="flex flex-wrap gap-x-12 gap-y-4">
        <Stat label="Total value" value={total} isLoading={isLoading} />
        <Stat label="Tokens" value={tokens} isLoading={isLoading} />
        <Stat label="Positions" value={positions} isLoading={isLoading} />
      </div>
      {isPartial && !isLoading && (
        <Typography variant="paragraph-small" color="muted">
          Leaves out the networks that couldn&apos;t be loaded.
        </Typography>
      )}
    </div>
  </Card>
)

export default SpaceAssetsTotals
