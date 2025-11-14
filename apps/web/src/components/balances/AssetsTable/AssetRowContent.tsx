import React, { type ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import TokenExplorerLink from '@/components/common/TokenExplorerLink'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from './FiatChange'
import { FiatBalance } from './FiatBalance'
import { PromoButtons } from './PromoButtons'
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

  return (
    <Box className={css.mobileAssetRow}>
      <div className={css.token}>
        <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} />

        <Stack>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Typography component="span" fontWeight="bold">
              {item.tokenInfo.name}
              {!isNative && <TokenExplorerLink address={item.tokenInfo.address} />}
            </Typography>
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
          <Typography variant="body2" color="primary.light" className={css.desktopSymbol}>
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
