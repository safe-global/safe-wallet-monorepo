import { Box, Skeleton, Typography } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'

const TotalAssetValue = ({
  fiatTotal,
  title = 'Total asset value',
}: {
  fiatTotal: string | number | undefined
  title?: string
}) => {
  const { safe } = useSafeInfo()
  const { balances } = useVisibleBalances()

  return (
    <Box>
      <Typography fontWeight={700} mb={0.5} fontSize="14px" sx={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </Typography>
      <Typography component="div" variant="h1" fontSize="24px" lineHeight="1.2" letterSpacing="-0.5px">
        {safe.deployed ? (
          fiatTotal !== undefined ? (
            <FiatValue value={fiatTotal} precise />
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
