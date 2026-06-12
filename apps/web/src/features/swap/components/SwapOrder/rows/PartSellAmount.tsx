import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@/components/ui/typography'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { DataRow } from '@/components/common/Table/DataRow'

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
      <div>
        <Typography variant="paragraph-bold" className="inline">
          {formatVisualAmount(partSellAmount, sellToken.decimals)} {sellToken.symbol}
        </Typography>
        <Typography className="inline text-[var(--color-primary-light)]">{` ${addonText}`}</Typography>
      </div>
    </DataRow>
  )
}
