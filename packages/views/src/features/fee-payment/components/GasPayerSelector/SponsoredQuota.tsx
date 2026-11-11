import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'

export const SponsoredQuota = ({
  left,
  quota,
  resetsAt,
}: {
  left: number
  quota: number
  resetsAt?: string | null
}): ReactElement => (
  <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2" data-testid="sponsored-quota">
    <Typography variant="paragraph-small">
      <span className="font-semibold" data-testid="sponsored-txs-left">
        {left}
      </span>
      <span className="text-muted-foreground">/{quota} sponsored transactions left</span>
    </Typography>
    {resetsAt && <Badge variant="subtle">Resets {resetsAt}</Badge>}
  </div>
)

/** A gas campaign's sponsored transactions left in the Fees card footer. */
export const CampaignQuota = ({ left, limit }: { left: number; limit: number }): ReactElement => (
  <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2" data-testid="campaign-quota">
    <Typography variant="paragraph-small">Sponsored by the gas campaign</Typography>
    <Badge variant="subtle">
      <span data-testid="sponsored-txs-left">{left}</span>/{limit} left
    </Badge>
  </div>
)
