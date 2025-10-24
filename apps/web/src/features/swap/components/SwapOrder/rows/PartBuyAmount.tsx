import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@mui/material'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { DataRow } from '@/components/common/Table/DataRow'
import { Box } from '@mui/system'

export const PartBuyAmount = ({
  order,
  addonText = '',
}: {
  order: Pick<TwapOrderTransactionInfo, 'minPartLimit' | 'buyToken'>
  addonText?: string
}) => {
  const { minPartLimit, buyToken } = order
  return (
    <DataRow title="Buy amount" key="buy_amount_part">
      <Box>
        <Typography component="span" fontWeight="bold">
          {formatVisualAmount(minPartLimit, buyToken.decimals)} {buyToken.symbol}
        </Typography>
        <Typography component="span" color="var(--color-primary-light)">
          {` ${addonText}`}
        </Typography>
      </Box>
    </DataRow>
  )
}
