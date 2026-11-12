import { Badge } from '@safe-global/views/components/ui/badge'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { formatCompactUsd } from '../copy'

const TIERS = [
  {
    name: 'Base',
    where: 'Listed under "More options" and in search',
    rule: 'Every option that passes the listing checks',
  },
  {
    name: 'Featured',
    where: 'On the shelf in its category, labelled "Featured"',
    rule: 'Rank inside the category stays set by risk and exit time',
  },
  {
    name: 'Premium',
    where: 'On the shelf with a "Partner" label and a launch slot',
    rule: 'Never in the idle-cash prompt, never above a lower-risk option',
  },
]

// Mock attribution for partner conversations; not real data.
const ATTRIBUTION = {
  tvl: 42_600_000,
  safes: 118,
  medianDeposit: 250_000,
  bySurface: [
    { surface: 'Shelf', share: 0.46 },
    { surface: 'Fact sheet from search', share: 0.21 },
    { surface: 'Category from idle-cash prompt', share: 0.24 },
    { surface: 'Policy sweep', share: 0.09 },
  ],
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    <Typography variant="h3">{value}</Typography>
  </div>
)

export const PartnerView = () => (
  <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 p-4 sm:p-6" data-testid="partner-view">
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Typography variant="h2">Partner view</Typography>
        <Badge variant="warning">Mock data</Badge>
      </div>
      <Typography color="muted">
        Where a listing appears in Safe, and how much treasury cash reached it through Safe.
      </Typography>
    </header>

    <section className="flex flex-col gap-3">
      <Typography variant="h4">Placement</Typography>
      <div className="grid gap-3 md:grid-cols-3">
        {TIERS.map((tier) => (
          <Card key={tier.name} variant="muted" size="sm">
            <CardContent>
              <div className="flex flex-col gap-2">
                <Typography variant="paragraph-bold">{tier.name}</Typography>
                <Typography variant="paragraph-small">{tier.where}</Typography>
                <Typography variant="paragraph-small" color="muted">
                  {tier.rule}
                </Typography>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    <section className="flex flex-col gap-3">
      <Typography variant="h4">Deposits from Safe, last 30 days</Typography>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Deposits held" value={formatCompactUsd(ATTRIBUTION.tvl)} />
        <Metric label="Safes depositing" value={String(ATTRIBUTION.safes)} />
        <Metric label="Median deposit" value={formatCompactUsd(ATTRIBUTION.medianDeposit)} />
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <Typography variant="paragraph-small-bold">Where deposits started</Typography>
        {ATTRIBUTION.bySurface.map((row) => (
          <div key={row.surface} className="grid grid-cols-[12rem_1fr_3rem] items-center gap-3">
            <Typography variant="paragraph-small">{row.surface}</Typography>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${row.share * 100}%` }} />
            </div>
            <Typography variant="paragraph-small-medium" align="right">
              {Math.round(row.share * 100)}%
            </Typography>
          </div>
        ))}
        <Typography variant="paragraph-mini" color="muted">
          The idle-cash prompt points to a category, so deposits that start there are shared across that category.
        </Typography>
      </div>
    </section>
  </div>
)
