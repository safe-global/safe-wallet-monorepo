import { Box, Skeleton, Typography, Stack } from '@mui/material'
import type { ReactNode } from 'react'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { InfoTooltip } from '@/components/common/InfoTooltip'

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
  const fontSizeValue = size === 'lg' ? '44px' : '24px'
  const { safe } = useSafeInfo()
  const { balances } = useVisibleBalances()

  return (
    <Box>
      <Typography fontWeight={700} fontSize="14px" mb={0.5} sx={{ color: 'var(--color-text-secondary)' }}>
        {title}
        {tooltipTitle && <InfoTooltip title={tooltipTitle} />}
      </Typography>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
        <Typography component="div" variant="h1" fontSize={fontSizeValue} lineHeight="1.2" letterSpacing="-0.5px">
          {safe.deployed ? (
            fiatTotal !== undefined ? (
              <>
                <FiatValue value={fiatTotal} precise />
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
