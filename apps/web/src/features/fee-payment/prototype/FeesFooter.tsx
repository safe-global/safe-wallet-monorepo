import type { ReactElement } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import ProChip from '@safe-global/views/assets/images/safe-pro/pro-chip.svg'
import { ProUpsell } from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import { SponsoredQuota } from '@safe-global/views/features/fee-payment/components/SponsoredQuota'
import type { FeePayerView } from '@safe-global/views/features/fee-payment/types'
import { _formatResetsAt } from '@/components/tx/SponsoredTxsCounter'

export const FeesFooter = ({ footer }: { footer: FeePayerView['footer'] }): ReactElement | null => {
  if (footer.kind === 'none') return null
  if (footer.kind === 'upsell')
    return (
      <ProUpsell
        upgradeButton={
          <Button variant="outline" size="xs">
            Upgrade to
            <span className="block h-4 w-6" aria-label="Safe Pro">
              <ProChip className="size-full" />
            </span>
          </Button>
        }
      />
    )
  const resets = _formatResetsAt(footer.resetsAt)
  return (
    <SponsoredQuota
      left={String(footer.left ?? '∞')}
      quota={String(footer.quota ?? '∞')}
      resetsLabel={resets ? `Resets ${resets}` : undefined}
    />
  )
}
