import { Box, Skeleton, Typography, Stack } from '@mui/material'
import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { InfoTooltip } from '@/features/stake/components/InfoTooltip'

const TotalAssetValue = ({
  fiatTotal,
  title = 'Total asset value',
  size = 'md',
  action,
  isAllTokensMode,
}: {
  fiatTotal: string | number | undefined
  title?: string
  size?: 'md' | 'lg'
  action?: ReactNode
  isAllTokensMode?: boolean
}) => {
  const fontSizeValue = size === 'lg' ? '44px' : '24px'
  const { safe } = useSafeInfo()
  const { balances } = useVisibleBalances()

  return (
    <Box>
      <Typography fontWeight={700} fontSize="14px" mb={0.5} sx={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </Typography>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
        <Typography component="div" variant="h1" fontSize={fontSizeValue} lineHeight="1.2" letterSpacing="-0.5px">
          {safe.deployed ? (
            fiatTotal !== undefined ? (
              <>
                <FiatValue value={fiatTotal} precise />
                {isAllTokensMode && (
                  <InfoTooltip title="Total from this list only. Portfolio total includes positions and may use other token data." />
                )}
              </>
            ) : (
              <Skeleton variant="text" width={60} />
            )
          ) : (
            <TokenAmount
              value={balances.items[0]?.balance}
              decimals={balances.items[0]?.tokenInfo.decimals}
              tokenSymbol={balances.items[0]?.tokenInfo.symbol}
            />
          )}
        </Typography>
        {action}
      </Stack>
    </Box>
  )
}

export default TotalAssetValue
