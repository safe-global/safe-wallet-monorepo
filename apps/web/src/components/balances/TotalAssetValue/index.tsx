import { Box, Skeleton, Typography } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import usePortfolio from '@/hooks/usePortfolio'

const TotalAssetValue = ({
  fiatTotal,
  title = 'Total asset value',
  size = 'md',
}: {
  fiatTotal: string | number | undefined
  title?: string
  size?: 'md' | 'lg'
}) => {
  const fontSizeValue = size === 'lg' ? '44px' : '24px'
  const { safe } = useSafeInfo()
  const { visibleTokenBalances } = usePortfolio()

  return (
    <Box>
      <Typography fontWeight={700} mb={0.5} fontSize="14px" sx={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </Typography>
      <Typography component="div" variant="h1" fontSize={fontSizeValue} lineHeight="1.2" letterSpacing="-0.5px">
        {safe.deployed ? (
          fiatTotal !== undefined ? (
            <FiatValue value={fiatTotal} precise />
          ) : (
            <Skeleton variant="text" width={60} />
          )
        ) : (
          <TokenAmount
            value={visibleTokenBalances[0]?.balance}
            decimals={visibleTokenBalances[0]?.tokenInfo.decimals}
            tokenSymbol={visibleTokenBalances[0]?.tokenInfo.symbol}
          />
        )}
      </Typography>
    </Box>
  )
}

export default TotalAssetValue
