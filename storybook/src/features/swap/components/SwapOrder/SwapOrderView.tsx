import type { ReactElement, ReactNode } from 'react'
import type { TwapOrderTransactionInfo as SwapTwapOrder } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { OrderStatuses } from '@safe-global/store/gateway/types'
import { Fragment } from 'react'
import StatusLabel from '@views/features/swap/components/StatusLabel'
import { formatDateTime, formatTimeInWords } from '@safe-global/utils/utils/date'
import { DataRow } from '@/components/common/Table/DataRow'
import { DataTable } from '@/components/common/Table/DataTable'
import { EmptyRow } from '@/components/common/Table/EmptyRow'
import { Typography } from '@/components/ui/typography'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { PartDuration } from '@views/features/swap/components/SwapOrder/rows/PartDuration'
import { PartSellAmount } from '@views/features/swap/components/SwapOrder/rows/PartSellAmount'
import { PartBuyAmount } from '@views/features/swap/components/SwapOrder/rows/PartBuyAmount'
import css from './styles.module.css'

type StatusLabelStatus = OrderStatuses | 'partiallyFilled'

export const AmountRowView = ({
  isSellOrder,
  sellAmount,
  buyAmount,
}: {
  isSellOrder: boolean
  sellAmount: ReactNode
  buyAmount: ReactNode
}) => {
  return (
    <DataRow key="Amount" title="Amount">
      <div className={`flex ${isSellOrder ? 'flex-col' : 'flex-col-reverse'}`}>
        <div>
          <span className={css.value}>
            {isSellOrder ? 'Sell' : 'For at most'} {sellAmount}
          </span>
        </div>
        <div>
          <span className={css.value}>
            {isSellOrder ? 'for at least' : 'Buy'} {buyAmount}
          </span>
        </div>
      </div>
    </DataRow>
  )
}

export const PriceRowView = ({
  isFulfilled,
  executionPrice,
  limitPrice,
  buyTokenSymbol,
  sellTokenSymbol,
}: {
  isFulfilled: boolean
  executionPrice: number
  limitPrice: number
  buyTokenSymbol: string
  sellTokenSymbol: string
}) => {
  if (isFulfilled) {
    return (
      <DataRow key="Execution price" title="Execution price">
        1 {buyTokenSymbol} = {formatAmount(executionPrice)} {sellTokenSymbol}
      </DataRow>
    )
  }

  return (
    <DataRow key="Limit price" title="Limit price">
      1 {buyTokenSymbol} = {formatAmount(limitPrice)} {sellTokenSymbol}
    </DataRow>
  )
}

export const ExpiryRowView = ({ validUntil, isNotExpired }: { validUntil: number; isNotExpired: boolean }) => {
  if (isNotExpired) {
    return (
      <DataRow key="Expiry" title="Expiry">
        <Typography>
          <span className="font-bold">{formatTimeInWords(validUntil * 1000)}</span> ({formatDateTime(validUntil * 1000)}
          )
        </Typography>
      </DataRow>
    )
  }

  return (
    <DataRow key="Expiry" title="Expiry">
      {formatDateTime(validUntil * 1000)}
    </DataRow>
  )
}

export const SurplusRowView = ({ surplusPrice, tokenSymbol }: { surplusPrice: number; tokenSymbol: string }) => {
  return (
    <DataRow key="Surplus" title="Surplus">
      {formatAmount(surplusPrice)} {tokenSymbol}
    </DataRow>
  )
}

export const FilledRowView = ({ progress }: { progress: ReactNode }) => {
  return (
    <DataRow title="Filled" key="Filled">
      {progress}
    </DataRow>
  )
}

export const OrderUidRowView = ({ orderId }: { orderId: ReactNode }) => {
  return (
    <DataRow key="Order ID" title="Order ID">
      {orderId}
    </DataRow>
  )
}

export const StatusRowView = ({ status }: { status: StatusLabelStatus }) => {
  return (
    <DataRow key="Status" title="Status">
      <StatusLabel status={status} />
    </DataRow>
  )
}

export const RecipientRowView = ({ recipient }: { recipient: ReactNode }) => {
  return (
    <DataRow key="Recipient" title="Recipient">
      {recipient}
    </DataRow>
  )
}

export const SellOrderView = ({
  orderKindLabel,
  rows,
}: {
  orderKindLabel: string
  rows: ReactElement<typeof DataRow>[]
}) => {
  return <DataTable header={`${orderKindLabel} order`} rows={rows} />
}

export type TwapOrderViewProps = {
  order: SwapTwapOrder
  orderKindLabel: string
  amountRow: ReactElement
  priceRow: ReactElement
  surplusRow: ReactElement
  recipientRow: ReactElement
  feeRow: ReactElement
  filledRow?: ReactElement
  isNotExpired: boolean
  statusLabel?: StatusLabelStatus
}

export const TwapOrderView = ({
  order,
  orderKindLabel,
  amountRow,
  priceRow,
  surplusRow,
  recipientRow,
  feeRow,
  filledRow,
  isNotExpired,
  statusLabel,
}: TwapOrderViewProps) => {
  const { validUntil, numberOfParts } = order

  return (
    <DataTable
      header={`${orderKindLabel} order`}
      rows={[
        amountRow,
        priceRow,
        surplusRow,
        recipientRow,
        feeRow,
        <EmptyRow key="spacer-0" />,
        <DataRow title="No of parts" key="n_of_parts">
          {numberOfParts}
        </DataRow>,
        <PartSellAmount order={order} key="part_sell_amount" />,
        <PartBuyAmount order={order} key="part_buy_amount" />,
        filledRow ?? <Fragment key="filled-row" />,
        <PartDuration order={order} key="part_duration" />,
        <EmptyRow key="spacer-1" />,
        isNotExpired ? (
          <DataRow key="Expiry" title="Expiry">
            <Typography>
              <span className="font-bold">{formatTimeInWords(validUntil * 1000)}</span> (
              {formatDateTime(validUntil * 1000)})
            </Typography>
          </DataRow>
        ) : (
          <DataRow key="Expired" title="Expired">
            {formatDateTime(validUntil * 1000)}
          </DataRow>
        ),
        statusLabel !== undefined ? (
          <DataRow key="Status" title="Status">
            <StatusLabel status={statusLabel} />
          </DataRow>
        ) : (
          <Fragment key="status" />
        ),
      ]}
    />
  )
}
