import type { ReactElement } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { ProUpsell } from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import type { FeePayerView } from '@safe-global/views/features/fee-payment/types'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'

export const FeesFooter = ({ footer }: { footer: FeePayerView['footer'] }): ReactElement | null => {
  if (footer.kind === 'none') return null
  if (footer.kind === 'upsell')
    return (
      <ProUpsell
        upgradeButton={
          <Button variant="outline" size="xs">
            Upgrade to Pro
          </Button>
        }
      />
    )
  return <SponsoredTxsCounter {...footer} isPro={footer.isSubscription} />
}
