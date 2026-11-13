import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { Button } from '@safe-global/views/components/ui/button'
import ProChip from '@safe-global/views/assets/images/safe-pro/pro-chip.svg'
import GasPayerSelectorView, {
  ProUpsell as ProUpsellView,
  CampaignQuota,
  SponsoredQuota,
  type TokenIconRenderer,
} from '@safe-global/views/features/fee-payment/components/GasPayerSelector'
import { AppRoutes } from '@/config/routes'
import TokenIcon from '@/components/common/TokenIcon'
import SponsoredTxsCounter, { formatResetsAt } from '@/components/tx/SponsoredTxsCounter'
import Track from '@/components/common/Track'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { MixpanelEventParams, PlanSelectionEntryPoint, UpgradeFeature, UpgradeLocation } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import type { GasFeeDetails } from '@safe-global/views/features/fee-payment/types'
import type { FeePayerFooter } from '../../types'
import type { GasPayerSelection } from '../../hooks/useGasPayerSelection'

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
          </Button>
        </Track>
      }
    />
  )
}

const FeeCardFooter = ({ footer }: { footer: FeePayerFooter }): ReactElement | null => {
  if (footer.kind === 'none') return null
  if (footer.kind === 'upsell') return <ProUpsell />
  if (footer.kind === 'campaign') return <CampaignQuota left={footer.left} limit={footer.limit} />
  if (footer.isSubscription && footer.left !== null && footer.quota !== null)
    return <SponsoredQuota left={footer.left} quota={footer.quota} resetsAt={formatResetsAt(footer.resetsAt)} />
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

/** The fee card for a `useGasPayerSelection` result, at signing and at execution (with the gas details from `useGasFeeDetails`). */
const GasPayerSelector = ({
  selection,
  gasFeeDetails,
}: {
  selection: GasPayerSelection
  gasFeeDetails?: GasFeeDetails
}): ReactElement | null => {
  const currency = useAppSelector(selectCurrency)
  const { view } = selection
  if (!view) return null

  return (
    <GasPayerSelectorView
      view={view}
      onChoiceChange={selection.setChoice}
      onGasTokenChange={selection.onGasTokenChange}
      currency={currency}
      renderTokenIcon={renderTokenIcon}
      footer={view.footer.kind === 'none' ? null : <FeeCardFooter footer={view.footer} />}
      gasFeeDetails={gasFeeDetails}
    />
  )
}

export default GasPayerSelector
