import { Box, Divider, Stack, Typography } from '@mui/material'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/store/gateway/types'
import { type ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import FiatValue from '@/components/common/FiatValue'
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

  return (
    <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
      <Stack direction="row" spacing={4} flexWrap="wrap">
        {/* Token price */}
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Token price
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            <FiatValue value={item.fiatConversion === '0' ? null : item.fiatConversion} precise />
          </Typography>
        </Box>

        {/* Total value */}
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Total value
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            <FiatValue value={item.fiatBalance} precise />
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

        {/* Token address - only for non-native tokens */}
        {!isNative && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Token address
            </Typography>
            <EthHashInfo
              address={item.tokenInfo.address}
              chainId={chainId}
              hasExplorer
              showCopyButton
              shortAddress
              showAvatar={false}
            />
          </Box>
        )}
      </Stack>

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
