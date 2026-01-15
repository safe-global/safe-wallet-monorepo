import React, { type ReactElement } from 'react'
import { Box, Link, Stack, Typography } from '@mui/material'
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
    <Box className={css.mobileAssetRow}>
      <div className={css.token}>
        <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} size={32} />

        <Stack>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            {explorerLink ? (
              <Link
                href={explorerLink.href}
                target="_blank"
                rel="noreferrer"
                title={explorerLink.title}
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color: 'text.primary',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {item.tokenInfo.name}
              </Link>
            ) : (
              <Typography component="span" variant="body1" fontWeight="bold">
                {item.tokenInfo.name}
              </Typography>
            )}
            <PromoButtons
              tokenInfo={item.tokenInfo}
              chainId={chainId}
              isStakingPromoEnabled={isStakingPromoEnabled}
              isEarnPromoEnabled={isEarnPromoEnabled}
            />
          </Box>
          {showMobileBalance && (
            <Typography variant="body2" color="primary.light" className={css.mobileBalance} fontWeight="normal">
              <TokenAmount
                value={item.balance}
                decimals={item.tokenInfo.decimals}
                tokenSymbol={item.tokenInfo.symbol}
              />
            </Typography>
          )}
          <Typography
            variant="body2"
            color="primary.light"
            className={css.desktopSymbol}
            sx={{ fontSize: '13px' }}
            data-testid="token-symbol"
          >
            {item.tokenInfo.symbol}
          </Typography>
        </Stack>
      </div>
      {showMobileValue && (
        <Box className={css.mobileValue}>
          <Typography>
            <FiatBalance balanceItem={item} />
          </Typography>
          {item.fiatBalance24hChange && (
            <Typography variant="caption">
              <FiatChange balanceItem={item} inline />
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
