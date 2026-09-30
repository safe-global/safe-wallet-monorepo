import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import { TokenType } from '@safe-global/store/gateway/types'

const TotalAssetValue = ({
  fiatTotal,
  title = 'Total value',
  tooltipTitle,
  size = 'md',
  action,
}: {
  fiatTotal: string | number | undefined
  title?: string
  tooltipTitle?: string
  size?: 'md' | 'lg'
  action?: ReactNode
}) => {
  const fontSizeClass = size === 'lg' ? 'text-[44px]' : 'text-[24px]'
  const { safe } = useSafeInfo()
  const { balances } = useVisibleBalances()
  const { showUndeployedNativeValue } = useNativeTokenDisplay()
  const shouldHideNativeTokenValue = !safe.deployed && !showUndeployedNativeValue
  const hasOtherBalances =
    balances.items.length > 1 ||
    (balances.items.length === 1 && balances.items[0]?.tokenInfo.type !== TokenType.NATIVE_TOKEN)

  return (
    <div>
      <Typography variant="paragraph" className="mb-1 font-bold">
        {title}
        {tooltipTitle && <InfoTooltip title={tooltipTitle} />}
      </Typography>
      <div className="flex flex-row items-end justify-between">
        <div className={`m-0 font-semibold leading-[1.2] ${fontSizeClass}`}>
          {safe.deployed ? (
            fiatTotal !== undefined ? (
              <>
                <FiatValue value={fiatTotal} precise />
              </>
            ) : (
              <Skeleton className="h-[1.2em] w-[60px]" />
            )
          ) : shouldHideNativeTokenValue ? (
            hasOtherBalances ? (
              <FiatValue value={fiatTotal ?? '0'} precise />
            ) : (
              <FiatValue value="0" precise />
            )
          ) : (
            <TokenAmount
              value={balances.items[0]?.balance}
              decimals={balances.items[0]?.tokenInfo.decimals}
              tokenSymbol={balances.items[0]?.tokenInfo.symbol}
            />
          )}
        </div>
        {action}
      </div>
    </div>
  )
}

export default TotalAssetValue
