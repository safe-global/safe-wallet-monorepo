import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@/components/ui/typography'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { DataRow } from '@/components/common/Table/DataRow'

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
      <div>
        <Typography variant="paragraph-bold" className="inline">
          {formatVisualAmount(minPartLimit, buyToken.decimals)} {buyToken.symbol}
        </Typography>
        <Typography className="inline text-[var(--color-primary-light)]">{` ${addonText}`}</Typography>
      </div>
    </DataRow>
  )
}
