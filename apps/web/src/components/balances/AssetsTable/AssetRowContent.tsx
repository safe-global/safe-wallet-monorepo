import type { ReactElement } from 'react'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { PromoButtons } from './PromoButtons'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { AssetRowContentView } from '@views/components/balances/AssetsTable/AssetRowContentView'

interface AssetRowContentProps {
  item: Balance
  chainId: string
  isSafenetStakingEnabled: boolean
  isEarnPromoEnabled: boolean
  showMobileValue?: boolean
  showMobileBalance?: boolean
}

const isNativeToken = (tokenInfo: Balance['tokenInfo']) => {
  return tokenInfo.type === TokenType.NATIVE_TOKEN
}

export const AssetRowContent = ({
  item,
  chainId,
  isSafenetStakingEnabled,
  isEarnPromoEnabled,
  showMobileValue = false,
  showMobileBalance = false,
}: AssetRowContentProps): ReactElement => {
  const isNative = isNativeToken(item.tokenInfo)
  const currentChain = useCurrentChain()
  const explorerLink = !isNative && currentChain ? getBlockExplorerLink(currentChain, item.tokenInfo.address) : null

  return (
    <AssetRowContentView
      item={item}
      explorerLink={explorerLink ?? null}
      promoButtons={
        <PromoButtons
          tokenInfo={item.tokenInfo}
          chainId={chainId}
          isSafenetStakingEnabled={isSafenetStakingEnabled}
          isEarnPromoEnabled={isEarnPromoEnabled}
        />
      }
      showMobileValue={showMobileValue}
      showMobileBalance={showMobileBalance}
    />
  )
}
