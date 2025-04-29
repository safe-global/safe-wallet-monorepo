import { Fragment } from 'react'
import OrderId from '@/features/swap/components/OrderId'
import StatusLabel from '@/features/swap/components/StatusLabel'
import SwapProgress from '@/features/swap/components/SwapProgress'
import { capitalize } from '@/hooks/useMnemonicName'
import { formatDateTime, formatTimeInWords } from '@safe-global/utils/utils/date'
import Stack from '@mui/material/Stack'
import type { ReactElement } from 'react'
import type { TwapOrder as SwapTwapOrder } from '@safe-global/safe-gateway-typescript-sdk'
import {
  type Order,
  type SwapOrder as SwapOrderType,
  type TransactionData,
} from '@safe-global/safe-gateway-typescript-sdk'
import { DataRow } from '@/components/common/Table/DataRow'
import { DataTable } from '@/components/common/Table/DataTable'
import { compareAsc } from 'date-fns'
import css from './styles.module.css'
import { Typography } from '@mui/material'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import {
  getExecutionPrice,
  getLimitPrice,
  getOrderClass,
  getPartiallyFilledSurplus,
  getSurplusPrice,
  isOrderPartiallyFilled,
} from '@/features/swap/helpers/utils'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isSwapOrderTxInfo, isSwapTransferOrderTxInfo, isTwapOrderTxInfo } from '@/utils/transaction-guards'
import { EmptyRow } from '@/components/common/Table/EmptyRow'
import { PartDuration } from '@/features/swap/components/SwapOrder/rows/PartDuration'
import { PartSellAmount } from '@/features/swap/components/SwapOrder/rows/PartSellAmount'
import { PartBuyAmount } from '@/features/swap/components/SwapOrder/rows/PartBuyAmount'
import { SurplusFee } from '@/features/swap/components/SwapOrder/rows/SurplusFee'

type SwapOrderProps = {
  txData?: TransactionData
  txInfo?: Order
}

const TWAP_PARTS_STATUS_THRESHOLD = 10

const AmountRow = ({ order }: { order: Order }) => {
  const { sellToken, buyToken, sellAmount, buyAmount, kind } = order
  const isSellOrder = kind === 'sell'
  return (
    <DataRow key="Amount" title="Amount">
      <Stack
        sx={{
          flexDirection: isSellOrder ? 'column' : 'column-reverse',
        }}
      >
        <div>
          <span className={css.value}>
            {isSellOrder ? 'Sell' : 'For at most'}{' '}
            <TokenAmount
              value={sellAmount}
              decimals={sellToken.decimals}
              tokenSymbol={sellToken.symbol}
              logoUri={sellToken.logoUri ?? undefined}
            />
          </span>
        </div>
        <div>
          <span className={css.value}>
            {isSellOrder ? 'for at least' : 'Buy'}{' '}
            <TokenAmount
              value={buyAmount}
              decimals={buyToken.decimals}
              tokenSymbol={buyToken.symbol}
              logoUri={buyToken.logoUri ?? undefined}
            />
          </span>
        </div>
      </Stack>
    </DataRow>
  )
}

const PriceRow = ({ order }: { order: Order }) => {
  const { status, sellToken, buyToken } = order
  const executionPrice = getExecutionPrice(order)
  const limitPrice = getLimitPrice(order)

  if (status === 'fulfilled') {
    return (
      <DataRow key="Execution price" title="Execution price">
        1 {buyToken.symbol} = {formatAmount(executionPrice)} {sellToken.symbol}
      </DataRow>
    )
  }

  return (
    <DataRow key="Limit price" title="Limit price">
      1 {buyToken.symbol} = {formatAmount(limitPrice)} {sellToken.symbol}
    </DataRow>
  )
}

const ExpiryRow = ({ order }: { order: Order }) => {
  const { validUntil, status } = order
  const now = new Date()
  const expires = new Date(validUntil * 1000)
  if (status! == 'fulfilled') {
    if (compareAsc(now, expires) !== 1) {
      return (
        <DataRow key="Expiry" title="Expiry">
          <Typography>
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
              }}
            >
              {formatTimeInWords(validUntil * 1000)}
            </Typography>{' '}
            ({formatDateTime(validUntil * 1000)})
          </Typography>
        </DataRow>
      )
    } else {
      return (
        <DataRow key="Expiry" title="Expiry">
          {formatDateTime(validUntil * 1000)}
        </DataRow>
      )
    }
  }

  return null
}

const SurplusRow = ({ order }: { order: Order }) => {
  const { status, kind } = order
  const isPartiallyFilled = isOrderPartiallyFilled(order)
  const surplusPrice = isPartiallyFilled ? getPartiallyFilledSurplus(order) : getSurplusPrice(order)
  const { sellToken, buyToken } = order
  const isSellOrder = kind === 'sell'
  if (status === 'fulfilled' || isPartiallyFilled) {
    return (
      <DataRow key="Surplus" title="Surplus">
        {formatAmount(surplusPrice)} {isSellOrder ? buyToken.symbol : sellToken.symbol}
      </DataRow>
    )
  }

  return null
}

const FilledRow = ({ order }: { order: Order }) => {
  const orderClass = getOrderClass(order)
  if (['limit', 'twap'].includes(orderClass)) {
    return (
      <DataRow title="Filled" key="Filled">
        <SwapProgress order={order} />
      </DataRow>
    )
  }

  return null
}

const OrderUidRow = ({ order }: { order: Order }) => {
  if (isSwapOrderTxInfo(order) || isSwapTransferOrderTxInfo(order)) {
    const { uid, explorerUrl } = order
    return (
      <DataRow key="Order ID" title="Order ID">
        <OrderId orderId={uid} href={explorerUrl} />
      </DataRow>
    )
  }
  return null
}

const StatusRow = ({ order }: { order: Order }) => {
  const { status } = order
  const isPartiallyFilled = isOrderPartiallyFilled(order)
  return (
    <DataRow key="Status" title="Status">
      <StatusLabel status={isPartiallyFilled ? 'partiallyFilled' : status} />
    </DataRow>
  )
}

const RecipientRow = ({ order }: { order: Order }) => {
  const { safeAddress } = useSafeInfo()
  const { receiver } = order

  if (receiver && receiver !== safeAddress) {
    return (
      <DataRow key="Recipient" title="Recipient">
        <EthHashInfo address={receiver} showAvatar={false} />
      </DataRow>
    )
  }

  return null
}

export const SellOrder = ({ order }: { order: SwapOrderType }) => {
  const { kind } = order
  const orderKindLabel = capitalize(kind)

  return (
    <DataTable
      header={`${orderKindLabel} order`}
      rows={[
        <AmountRow order={order} key="amount-row" />,
        <PriceRow order={order} key="price-row" />,
        <SurplusRow order={order} key="surplus-row" />,
        <ExpiryRow order={order} key="expiry-row" />,
        <FilledRow order={order} key="filled-row" />,
        <OrderUidRow order={order} key="order-uid-row" />,
        <StatusRow order={order} key="status-row" />,
        <RecipientRow order={order} key="recipient-row" />,
        <SurplusFee order={order} key="fee-row" />,
      ]}
    />
  )
}

export const TwapOrder = ({ order }: { order: SwapTwapOrder }) => {
  const { kind, validUntil, status, numberOfParts } = order

  const isPartiallyFilled = isOrderPartiallyFilled(order)
  const expires = new Date(validUntil * 1000)
  const now = new Date()
  const orderKindLabel = capitalize(kind)

  const isStatusKnown = Number(numberOfParts) <= TWAP_PARTS_STATUS_THRESHOLD
  return (
    <DataTable
      header={`${orderKindLabel} order`}
      rows={[
        <AmountRow order={order} key="amount-row" />,
        <PriceRow order={order} key="price-row" />,
        <SurplusRow order={order} key="surplus-row" />,
        <RecipientRow order={order} key="recipient-row" />,
        <SurplusFee order={order} key="fee-row" />,
        <EmptyRow key="spacer-0" />,
        <DataRow title="No of parts" key="n_of_parts">
          {numberOfParts}
        </DataRow>,
        <PartSellAmount order={order} key="part_sell_amount" />,
        <PartBuyAmount order={order} key="part_buy_amount" />,
        order.executedSellAmount !== null && order.executedBuyAmount !== null ? (
          <FilledRow order={order} key="filled-row" />
        ) : (
          <Fragment key="filled-row" />
        ),
        <PartDuration order={order} key="part_duration" />,
        <EmptyRow key="spacer-1" />,
        status !== 'fulfilled' && compareAsc(now, expires) !== 1 ? (
          <DataRow key="Expiry" title="Expiry">
            <Typography>
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                }}
              >
                {formatTimeInWords(validUntil * 1000)}
              </Typography>{' '}
              ({formatDateTime(validUntil * 1000)})
            </Typography>
          </DataRow>
        ) : (
          <DataRow key="Expired" title="Expired">
            {formatDateTime(validUntil * 1000)}
          </DataRow>
        ),
        isStatusKnown ? (
          <DataRow key="Status" title="Status">
            <StatusLabel status={isPartiallyFilled ? 'partiallyFilled' : status} />
          </DataRow>
        ) : (
          <Fragment key="status" />
        ),
      ]}
    />
  )
}

export const SwapOrder = ({ txInfo }: SwapOrderProps): ReactElement | null => {
  if (!txInfo) return null

  if (isTwapOrderTxInfo(txInfo)) {
    return <TwapOrder order={txInfo} />
  }

  if (isSwapOrderTxInfo(txInfo) || isSwapTransferOrderTxInfo(txInfo)) {
    return <SellOrder order={txInfo} />
  }
  return null
}

export default SwapOrder
