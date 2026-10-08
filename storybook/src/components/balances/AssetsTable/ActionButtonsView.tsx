import type { ReactElement, ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import css from './styles.module.css'

export type ActionButtonsViewProps = {
  sendButton: ReactNode
  swapButton: ReactNode
  isSwapFeatureEnabled: boolean
  onlyIcon?: boolean
  mobile?: boolean
  showHiddenAssets?: boolean
  isSelected?: boolean
  onToggleAsset?: () => void
}

export const ActionButtonsView = ({
  sendButton,
  swapButton,
  isSwapFeatureEnabled,
  onlyIcon = false,
  mobile = false,
  showHiddenAssets = false,
  isSelected = false,
  onToggleAsset,
}: ActionButtonsViewProps): ReactElement => {
  if (mobile) {
    return (
      <div className={`flex flex-row ${css.mobileButtons}`}>
        <div className={css.mobileButtonWrapper}>{sendButton}</div>

        {isSwapFeatureEnabled && <div className={css.mobileButtonWrapper}>{swapButton}</div>}
      </div>
    )
  }

  return (
    <div className={`-mr-2 flex flex-row items-center justify-end gap-2 ${onlyIcon ? css.sticky : ''}`}>
      {sendButton}

      {isSwapFeatureEnabled && swapButton}

      {showHiddenAssets && onToggleAsset && (
        <div className="flex h-[28px] items-center">
          <Checkbox checked={isSelected} onClick={onToggleAsset} data-testid="hide-asset-checkbox" />
        </div>
      )}
    </div>
  )
}
