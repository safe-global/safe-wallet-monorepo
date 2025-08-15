import { Box, Skeleton, Typography } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import useFiatTotal from '@/hooks/useFiatTotal'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'

const TotalAssetValue = () => {
  const { safe } = useSafeInfo()
  const { balances } = useVisibleBalances()
  const fiatTotal = useFiatTotal()

  return (
    <Box>
      <Typography color="primary.light" fontWeight="bold" mb={1}>
        Total asset value
      </Typography>
      <Typography component="div" variant="h1" fontSize="44px" lineHeight="40px">
        {safe.deployed ? (
          fiatTotal ? (
            <FiatValue value={fiatTotal} />
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
