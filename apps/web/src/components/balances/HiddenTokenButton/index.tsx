import { type ReactElement } from 'react'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import useBalances from '@/hooks/useBalances'
import { HiddenTokenButtonView } from '@views/components/balances/HiddenTokenButton/HiddenTokenButtonView'

const HiddenTokenButton = ({
  toggleShowHiddenAssets,
  showHiddenAssets,
}: {
  toggleShowHiddenAssets?: () => void
  showHiddenAssets?: boolean
}): ReactElement | null => {
  const { balances } = useBalances()
  const currentHiddenAssets = useHiddenTokens()

  const hiddenAssetCount =
    balances.items?.filter((item) => currentHiddenAssets.includes(item.tokenInfo.address)).length || 0

  return (
    <HiddenTokenButtonView
      hiddenAssetCount={hiddenAssetCount}
      toggleShowHiddenAssets={toggleShowHiddenAssets}
      showHiddenAssets={showHiddenAssets}
    />
  )
}

export default HiddenTokenButton
