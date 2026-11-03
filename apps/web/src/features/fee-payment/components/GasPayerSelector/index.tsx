import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import ProChip from '@safe-global/views/assets/images/safe-pro/pro-chip.svg'
import GasPayerSelectorView, {
  ProUpsell as ProUpsellView,
  type TokenIconRenderer,
} from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import { AppRoutes } from '@/config/routes'
import TokenIcon from '@/components/common/TokenIcon'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'
import Track from '@/components/common/Track'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { MixpanelEventParams, PlanSelectionEntryPoint, UpgradeFeature, UpgradeLocation } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import type { FeePayerFooter, FeePayerView, GasPayerChoice } from '../../types'

const UPGRADE_PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SPONSORED_TX,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.TX_FLOW_GAS,
}

const renderTokenIcon: TokenIconRenderer = ({ logoUri, symbol }) => (
  <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
)

const ProUpsell = (): ReactElement => {
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, UPGRADE_PROMPT, true)

  return (
    <ProUpsellView
      upgradeButton={
        <Track
          {...SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED}
          mixpanelParams={{
            [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
            ...UPGRADE_PROMPT,
          }}
          className="shrink-0"
        >
          <Button variant="outline" size="xs" render={<NextLink href={AppRoutes.welcome.spaces} />}>
            Upgrade to
            <span className="block h-4 w-6" aria-label="Safe Pro">
              <ProChip className="size-full" />
            </span>
            <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
          </Button>
        </Track>
      }
    />
  )
}

const FeeCardFooter = ({ footer }: { footer: FeePayerFooter }): ReactElement | null => {
  if (footer.kind === 'none') return null
  if (footer.kind === 'upsell') return <ProUpsell />
  return (
    <SponsoredTxsCounter
      left={footer.left}
      quota={footer.quota}
      resetsAt={footer.resetsAt}
      isSubscription={footer.isSubscription}
      isPro={footer.isSubscription}
    />
  )
}

const GasPayerSelector = ({
  view,
  onChoiceChange,
  onGasTokenChange,
}: {
  view: FeePayerView
  onChoiceChange: (choice: GasPayerChoice) => void
  onGasTokenChange?: (address: string) => void
}): ReactElement => {
  const currency = useAppSelector(selectCurrency)

  return (
    <GasPayerSelectorView
      view={view}
      onChoiceChange={onChoiceChange}
      onGasTokenChange={onGasTokenChange}
      currency={currency}
      renderTokenIcon={renderTokenIcon}
      footer={view.footer.kind === 'none' ? null : <FeeCardFooter footer={view.footer} />}
    />
  )
}

export default GasPayerSelector
