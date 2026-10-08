import type {
  SwapOrderTransactionInfo as SwapOrderType,
  SwapTransferTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { TwapOrderTransactionInfo as SwapTwapOrder } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import OrderId from '../OrderId'
import SwapProgress from '../SwapProgress'
import { capitalize } from '@/hooks/useMnemonicName'
import type { ReactElement } from 'react'
import { compareAsc } from 'date-fns'
import {
  getExecutionPrice,
  getLimitPrice,
  getOrderClass,
  getPartiallyFilledSurplus,
  getSurplusPrice,
  isOrderPartiallyFilled,
} from '../../helpers/utils'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenAmount from '@/components/common/TokenAmount'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isSwapOrderTxInfo, isSwapTransferOrderTxInfo, isTwapOrderTxInfo } from '@/utils/transaction-guards'
import { SurplusFee } from './rows/SurplusFee'
import {
  AmountRowView,
  ExpiryRowView,
  FilledRowView,
  OrderUidRowView,
  PriceRowView,
  RecipientRowView,
  SellOrderView,
  StatusRowView,
  SurplusRowView,
  TwapOrderView,
} from '@views/features/swap/components/SwapOrder/SwapOrderView'

type SwapOrderProps = {
  txData?: TransactionData | null
  txInfo?: OrderTransactionInfo | null
}

const TWAP_PARTS_STATUS_THRESHOLD = 10

const AmountRow = ({ order }: { order: OrderTransactionInfo }) => {
  const { sellToken, buyToken, sellAmount, buyAmount, kind } = order
  const isSellOrder = kind === 'sell'
  return (
    <AmountRowView
      isSellOrder={isSellOrder}
      sellAmount={
        <TokenAmount
          value={sellAmount}
          decimals={sellToken.decimals}
          tokenSymbol={sellToken.symbol}
          logoUri={sellToken.logoUri ?? undefined}
        />
      }
      buyAmount={
        <TokenAmount
          value={buyAmount}
          decimals={buyToken.decimals}
          tokenSymbol={buyToken.symbol}
          logoUri={buyToken.logoUri ?? undefined}
        />
      }
    />
  )
}

const PriceRow = ({ order }: { order: OrderTransactionInfo }) => {
  const { status, sellToken, buyToken } = order
  const executionPrice = getExecutionPrice(order)
  const limitPrice = getLimitPrice(order)

  return (
    <PriceRowView
      isFulfilled={status === 'fulfilled'}
      executionPrice={executionPrice}
      limitPrice={limitPrice}
      buyTokenSymbol={buyToken.symbol}
      sellTokenSymbol={sellToken.symbol}
    />
  )
}

const ExpiryRow = ({ order }: { order: OrderTransactionInfo }) => {
  const { validUntil, status } = order
  const now = new Date()
  const expires = new Date(validUntil * 1000)
  if (status! == 'fulfilled') {
    return <ExpiryRowView validUntil={validUntil} isNotExpired={compareAsc(now, expires) !== 1} />
  }

  return null
}

const SurplusRow = ({ order }: { order: OrderTransactionInfo }) => {
  const { status, kind } = order
  const isPartiallyFilled = isOrderPartiallyFilled(order)
  const surplusPrice = isPartiallyFilled ? getPartiallyFilledSurplus(order) : getSurplusPrice(order)
  const { sellToken, buyToken } = order
  const isSellOrder = kind === 'sell'
  if (status === 'fulfilled' || isPartiallyFilled) {
    return <SurplusRowView surplusPrice={surplusPrice} tokenSymbol={isSellOrder ? buyToken.symbol : sellToken.symbol} />
  }

  return null
}

const FilledRow = ({ order }: { order: OrderTransactionInfo }) => {
  const orderClass = getOrderClass(order)
  if (['limit', 'twap'].includes(orderClass)) {
    return <FilledRowView progress={<SwapProgress order={order} />} />
  }

  return null
}

const OrderUidRow = ({ order }: { order: OrderTransactionInfo }) => {
  if (isSwapOrderTxInfo(order) || isSwapTransferOrderTxInfo(order)) {
    const { uid, explorerUrl } = order
    return <OrderUidRowView orderId={<OrderId orderId={uid} href={explorerUrl} />} />
  }
  return null
}

const StatusRow = ({ order }: { order: OrderTransactionInfo }) => {
  const { status } = order
  const isPartiallyFilled = isOrderPartiallyFilled(order)
  return <StatusRowView status={isPartiallyFilled ? 'partiallyFilled' : status} />
}

const RecipientRow = ({ order }: { order: OrderTransactionInfo }) => {
  const { safeAddress } = useSafeInfo()
  const { receiver } = order

  if (receiver && receiver !== safeAddress) {
    return <RecipientRowView recipient={<EthHashInfo address={receiver} showAvatar={false} />} />
  }

  return null
}

export const SellOrder = ({ order }: { order: SwapOrderType | SwapTransferTransactionInfo }) => {
  const { kind } = order
  const orderKindLabel = capitalize(kind)

  return (
    <SellOrderView
      orderKindLabel={orderKindLabel}
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
    <TwapOrderView
      order={order}
      orderKindLabel={orderKindLabel}
      amountRow={<AmountRow order={order} key="amount-row" />}
      priceRow={<PriceRow order={order} key="price-row" />}
      surplusRow={<SurplusRow order={order} key="surplus-row" />}
      recipientRow={<RecipientRow order={order} key="recipient-row" />}
      feeRow={<SurplusFee order={order} key="fee-row" />}
      filledRow={
        order.executedSellAmount !== null && order.executedBuyAmount !== null ? (
          <FilledRow order={order} key="filled-row" />
        ) : undefined
      }
      isNotExpired={status !== 'fulfilled' && compareAsc(now, expires) !== 1}
      statusLabel={isStatusKnown ? (isPartiallyFilled ? 'partiallyFilled' : status) : undefined}
    />
  )
}

const SwapOrder = ({ txInfo }: SwapOrderProps): ReactElement | null => {
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
