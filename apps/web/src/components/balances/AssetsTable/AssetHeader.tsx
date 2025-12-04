import { Stack, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatBalance } from './FiatBalance'
import { FiatChange } from './FiatChange'
import SendButton from './SendButton'
import SwapButton from '@/features/swap/components/SwapButton'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { type ReactElement } from 'react'
import css from './styles.module.css'

interface AssetHeaderProps {
  item: Balance
  weightShare: number | null
  isSwapFeatureEnabled: boolean
}

const AssetHeader = ({ item, weightShare, isSwapFeatureEnabled }: AssetHeaderProps): ReactElement => {
  return (
    <Stack direction="row" gap={1} alignItems="center" width={1}>
      <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} size={32} />

      <Stack>
        <Typography fontWeight="bold">{item.tokenInfo.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
        </Typography>
      </Stack>

      <Stack direction="column" alignItems="flex-end" ml="auto" mr={1}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {weightShare && (
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
          )}
          <Typography fontWeight="bold">
            <FiatBalance balanceItem={item} />
          </Typography>
        </Stack>
        {item.fiatBalance24hChange && (
          <Typography variant="caption">
            <FiatChange balanceItem={item} inline />
          </Typography>
        )}
      </Stack>

      <Stack direction="row" gap={1} alignItems="center" ml={1}>
        <SendButton tokenInfo={item.tokenInfo} />
        {isSwapFeatureEnabled && <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} />}
      </Stack>
    </Stack>
  )
}

export default AssetHeader
