import React, { type ReactElement } from 'react'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from './FiatChange'
import { FiatBalance } from './FiatBalance'
import { PromoButtons } from './PromoButtons'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'

interface AssetRowContentProps {
  item: Balance
  chainId: string
  isStakingPromoEnabled: boolean
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
  isStakingPromoEnabled,
  isEarnPromoEnabled,
  showMobileValue = false,
  showMobileBalance = false,
}: AssetRowContentProps): ReactElement => {
  const isNative = isNativeToken(item.tokenInfo)
  const currentChain = useCurrentChain()
  const explorerLink = !isNative && currentChain ? getBlockExplorerLink(currentChain, item.tokenInfo.address) : null

  return (
    <div className={css.mobileAssetRow}>
      <div className={css.token}>
        <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} size={32} />

        <div className="flex flex-col">
          <span className="inline-flex items-center gap-2">
            {explorerLink ? (
              <Link
                href={explorerLink.href}
                target="_blank"
                rel="noreferrer"
                title={explorerLink.title}
                variant="inherit"
                className="cursor-pointer font-bold text-[var(--color-text-primary)] no-underline hover:text-[var(--color-primary-main)] hover:underline"
              >
                {item.tokenInfo.name}
              </Link>
            ) : (
              <Typography variant="paragraph" className="font-bold">
                {item.tokenInfo.name}
              </Typography>
            )}
            <PromoButtons
              tokenInfo={item.tokenInfo}
              chainId={chainId}
              isStakingPromoEnabled={isStakingPromoEnabled}
              isEarnPromoEnabled={isEarnPromoEnabled}
            />
          </span>
          {showMobileBalance && (
            <Typography
              variant="paragraph-small"
              className={`font-normal text-[var(--color-primary-light)] ${css.mobileBalance}`}
            >
              <TokenAmount
                value={item.balance}
                decimals={item.tokenInfo.decimals}
                tokenSymbol={item.tokenInfo.symbol}
              />
            </Typography>
          )}
          <Typography
            variant="paragraph-small"
            className={`text-[13px] text-[var(--color-primary-light)] ${css.desktopSymbol}`}
            data-testid="token-symbol"
          >
            {item.tokenInfo.symbol}
          </Typography>
        </div>
      </div>
      {showMobileValue && (
        <div className={css.mobileValue}>
          <Typography variant="paragraph" as="div">
            <FiatBalance balanceItem={item} />
          </Typography>
          {item.fiatBalance24hChange && (
            <Typography variant="paragraph-mini">
              <FiatChange balanceItem={item} inline />
            </Typography>
          )}
        </div>
      )}
    </div>
  )
}
