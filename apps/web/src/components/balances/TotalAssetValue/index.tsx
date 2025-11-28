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
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <Typography fontWeight={700} fontSize="14px" sx={{ color: 'var(--color-text-secondary)' }}>
          {title}
        </Typography>
        {action}
      </Stack>
      <Typography component="div" variant="h1" fontSize={fontSizeValue} lineHeight="1.2" letterSpacing="-0.5px">
        {safe.deployed ? (
          fiatTotal !== undefined ? (
            <>
              <FiatValue value={fiatTotal} precise />
              {isAllTokensMode && (
                <InfoTooltip title="This total includes all tokens. Your portfolio total may differ." />
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
    </Box>
  )
}

export default TotalAssetValue
