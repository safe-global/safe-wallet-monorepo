import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useNativeTokenDisplay } from '@/hooks/useNativeTokenDisplay'
import { TokenType } from '@safe-global/store/gateway/types'
import SafeIcon from '@/components/common/SafeIcon'
import TokenAmount from '@/components/common/TokenAmount'
import EthHashInfo from '@/components/common/EthHashInfo'
import FiatValue from '@/components/common/FiatValue'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { HypernativeFeature, useIsHypernativeGuard } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

import css from './styles.module.css'

const SafeHeaderInfo = (): ReactElement => {
  const { balances } = useVisibleBalances()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const { threshold, owners } = safe
  const { ens } = useAddressResolver(safeAddress)
  const { SafeHeaderHnTooltip } = useLoadFeature(HypernativeFeature)
  const { isHypernativeGuard } = useIsHypernativeGuard()
  const { showUndeployedNativeValue } = useNativeTokenDisplay()
  const shouldHideNativeTokenValue = !safe.deployed && !showUndeployedNativeValue
  const hasOtherBalances =
    balances.items.length > 1 ||
    (balances.items.length === 1 && balances.items[0]?.tokenInfo.type !== TokenType.NATIVE_TOKEN)

  return (
    <div data-testid="safe-header-info" className={css.safe}>
      <div data-testid="safe-icon">
        {safeAddress ? (
          <SafeIcon address={safeAddress} threshold={threshold} owners={owners?.length} />
        ) : (
          <Skeleton className="size-10 rounded-full" />
        )}
      </div>

      <div className={css.address}>
        {safeAddress ? (
          <EthHashInfo
            address={safeAddress}
            shortAddress
            showAvatar={false}
            name={ens}
            badgeTooltip={isHypernativeGuard ? <SafeHeaderHnTooltip /> : undefined}
          />
        ) : (
          <Typography variant="paragraph-small">
            <Skeleton className="h-4 w-[86px]" />
            <Skeleton className="h-4 w-[120px]" />
          </Typography>
        )}

        <Typography data-testid="currency-section" variant="paragraph-small-bold">
          {safe.deployed ? (
            balances.fiatTotal ? (
              <>
                <FiatValue value={balances.fiatTotal} />
                {balances.isAllTokensMode && <InfoTooltip title="Total based on default tokens and positions." />}
              </>
            ) : (
              <Skeleton className="h-4 w-[60px]" />
            )
          ) : shouldHideNativeTokenValue ? (
            hasOtherBalances ? (
              <FiatValue value={balances.fiatTotal} />
            ) : (
              <FiatValue value="0" />
            )
          ) : (
            <TokenAmount
              value={balances.items[0]?.balance}
              decimals={balances.items[0]?.tokenInfo.decimals}
              tokenSymbol={balances.items[0]?.tokenInfo.symbol}
            />
          )}
        </Typography>
      </div>
    </div>
  )
}

export default SafeHeaderInfo
