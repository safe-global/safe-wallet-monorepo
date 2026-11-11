import type { ReactElement } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'

export type SponsoredQuotaProps = {
  left: string
  quota: string
  /** e.g. "Resets Dec 1, 00:00 UTC"; no pill without it. */
  resetsLabel?: string
}

export const SponsoredQuota = ({ left, quota, resetsLabel }: SponsoredQuotaProps): ReactElement => (
  <div className="flex items-center justify-between gap-3 px-4 py-2" data-testid="sponsored-quota">
    <Typography variant="paragraph-small">
      <span className="font-semibold">{left}</span>
      <span className="text-muted-foreground">/{quota} sponsored transactions left</span>
    </Typography>
    {resetsLabel && <Badge variant="subtle">{resetsLabel}</Badge>}
  </div>
)
