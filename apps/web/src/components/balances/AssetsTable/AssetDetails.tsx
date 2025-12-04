import { Box, Divider, Stack, Typography } from '@mui/material'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/store/gateway/types'
import { type ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import StakeButton from '@/features/stake/components/StakeButton'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'

interface AssetDetailsProps {
  item: Balance
  chainId: string
  isStakingPromoEnabled: boolean
  weightShare: number | null
}

const AssetDetails = ({ item, chainId, isStakingPromoEnabled, weightShare }: AssetDetailsProps): ReactElement => {
  const isNative = item.tokenInfo.type === TokenType.NATIVE_TOKEN
  const showStakeButton = isStakingPromoEnabled && isNative
  const priceValue = parseFloat(item.fiatConversion)
  const showPrecisePrice = priceValue >= 1 || priceValue === 0

  return (
    <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
      <Stack direction="row" spacing={4} flexWrap="wrap">
        {/* Price */}
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Price
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            <FiatValue value={item.fiatConversion === '0' ? null : item.fiatConversion} precise={showPrecisePrice} />
          </Typography>
        </Box>

        {/* Balance */}
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Balance
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
          </Typography>
        </Box>

        {/* Weight */}
        {weightShare && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Weight
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <div className={css.customProgress}>
                <div
                  className={css.progressRing}
                  style={
                    {
                      '--progress': `${(weightShare * 100).toFixed(1)}%`,
                    } as React.CSSProperties & { '--progress': string }
                  }
                />
              </div>
              <Typography variant="body1" fontWeight="bold">
                {formatPercentage(weightShare)}
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Address - only for non-native tokens */}
      {!isNative && (
        <>
          <Divider />
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Token address
            </Typography>
            <EthHashInfo
              address={item.tokenInfo.address}
              chainId={chainId}
              hasExplorer
              showCopyButton
              shortAddress={false}
              showAvatar={false}
            />
          </Box>
        </>
      )}

      {/* Stake Button */}
      {showStakeButton && (
        <>
          <Divider />
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} />
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default AssetDetails
