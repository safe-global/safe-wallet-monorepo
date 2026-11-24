import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const SponsoredQuota = ({ left, resetsAt }: { left: number; resetsAt?: string | null }): ReactElement => (
  <div className="flex items-center justify-between gap-3 px-4 py-2" data-testid="sponsored-quota">
    <Typography variant="paragraph-small">
      <span className="font-semibold" data-testid="sponsored-txs-left">
        {left}
      </span>
      <span className="text-muted-foreground">{` sponsored transaction${maybePlural(left)} left this month`}</span>
    </Typography>
    {resetsAt && <Badge variant="subtle">Resets {resetsAt}</Badge>}
  </div>
)

/** A gas campaign's sponsored transactions left in the Fees card footer. */
export const CampaignQuota = ({ left, limit }: { left: number; limit: number }): ReactElement => (
  <div className="flex items-center justify-between gap-3 px-4 py-2" data-testid="campaign-quota">
    <Typography variant="paragraph-small">Sponsored by the gas campaign</Typography>
    <Badge variant="subtle">
      <span data-testid="sponsored-txs-left">{left}</span>/{limit} left
    </Badge>
  </div>
)
