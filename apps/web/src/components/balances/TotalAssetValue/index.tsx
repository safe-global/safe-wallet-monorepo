import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import { TokenType } from '@safe-global/store/gateway/types'
import { TotalAssetValueView } from '@views/components/balances/TotalAssetValue/TotalAssetValueView'

const TotalAssetValue = ({
  fiatTotal,
  title,
  tooltipTitle,
  size,
  action,
}: {
  fiatTotal: string | number | undefined
  title?: string
  tooltipTitle?: string
  size?: 'md' | 'lg'
  action?: ReactNode
}) => {
  const { safe } = useSafeInfo()
  const { balances } = useVisibleBalances()
  const { showUndeployedNativeValue } = useNativeTokenDisplay()
  const shouldHideNativeTokenValue = !safe.deployed && !showUndeployedNativeValue
  const hasOtherBalances =
    balances.items.length > 1 ||
    (balances.items.length === 1 && balances.items[0]?.tokenInfo.type !== TokenType.NATIVE_TOKEN)

  const value = safe.deployed ? (
    fiatTotal !== undefined ? (
      <FiatValue value={fiatTotal} precise />
    ) : undefined
  ) : shouldHideNativeTokenValue ? (
    <FiatValue value={hasOtherBalances ? (fiatTotal ?? '0') : '0'} precise />
  ) : (
    <TokenAmount
      value={balances.items[0]?.balance}
      decimals={balances.items[0]?.tokenInfo.decimals}
      tokenSymbol={balances.items[0]?.tokenInfo.symbol}
    />
  )

  return <TotalAssetValueView title={title} tooltipTitle={tooltipTitle} size={size} action={action} value={value} />
}

export default TotalAssetValue
