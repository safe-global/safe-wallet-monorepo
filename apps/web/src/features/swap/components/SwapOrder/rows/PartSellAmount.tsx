import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@mui/material'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { DataRow } from '@/components/common/Table/DataRow'
import { Box } from '@mui/system'

export const PartSellAmount = ({
  order,
  addonText = '',
}: {
  order: Pick<TwapOrderTransactionInfo, 'partSellAmount' | 'sellToken'>
  addonText?: string
}) => {
  const { partSellAmount, sellToken } = order
  return (
    <DataRow title="Sell amount" key="sell_amount_part">
      <Box>
        <Typography component="span" fontWeight="bold">
          {formatVisualAmount(partSellAmount, sellToken.decimals)} {sellToken.symbol}
        </Typography>
        <Typography component="span" color="var(--color-primary-light)">
          {` ${addonText}`}
        </Typography>
      </Box>
    </DataRow>
  )
}
