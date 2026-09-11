import React, { type ReactElement } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import SendButton from './SendButton'
import { SwapFeature } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import css from './styles.module.css'

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

  if (mobile) {
    return (
      <div className={`flex flex-row ${css.mobileButtons}`}>
        <div className={css.mobileButtonWrapper}>
          <SendButton tokenInfo={tokenInfo} />
        </div>

        {isSwapFeatureEnabled && (
          <div className={css.mobileButtonWrapper}>
            <SwapButton tokenInfo={tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`-mr-2 flex flex-row items-center justify-end gap-2 ${onlyIcon ? css.sticky : ''}`}>
      <SendButton tokenInfo={tokenInfo} onlyIcon={onlyIcon} />

      {isSwapFeatureEnabled && (
        <SwapButton tokenInfo={tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} onlyIcon={onlyIcon} />
      )}

      {showHiddenAssets && onToggleAsset && (
        <div className="flex h-[28px] items-center">
          <Checkbox checked={isSelected} onClick={onToggleAsset} data-testid="hide-asset-checkbox" />
        </div>
      )}
    </div>
  )
}
