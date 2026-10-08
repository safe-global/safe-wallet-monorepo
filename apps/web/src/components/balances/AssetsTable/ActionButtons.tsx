import type { ReactElement } from 'react'
import SendButton from './SendButton'
import { SwapFeature } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { ActionButtonsView } from '@views/components/balances/AssetsTable/ActionButtonsView'

const SWAP_AMOUNT = '0'

interface ActionButtonsProps {
  tokenInfo: Balance['tokenInfo']
  isSwapFeatureEnabled: boolean
  onlyIcon?: boolean
  mobile?: boolean
  showHiddenAssets?: boolean
  isSelected?: boolean
  onToggleAsset?: () => void
}

export const ActionButtons = ({
  tokenInfo,
  isSwapFeatureEnabled,
  onlyIcon = false,
  mobile = false,
  showHiddenAssets = false,
  isSelected = false,
  onToggleAsset,
}: ActionButtonsProps): ReactElement => {
  const { SwapButton } = useLoadFeature(SwapFeature)
  const iconOnly = mobile ? undefined : onlyIcon

  return (
    <ActionButtonsView
      sendButton={<SendButton tokenInfo={tokenInfo} onlyIcon={iconOnly} />}
      swapButton={
        <SwapButton tokenInfo={tokenInfo} amount={SWAP_AMOUNT} trackingLabel={SWAP_LABELS.asset} onlyIcon={iconOnly} />
      }
      isSwapFeatureEnabled={isSwapFeatureEnabled}
      onlyIcon={onlyIcon}
      mobile={mobile}
      showHiddenAssets={showHiddenAssets}
      isSelected={isSelected}
      onToggleAsset={onToggleAsset}
    />
  )
}
