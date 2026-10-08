import { TransactionInfoType } from '@safe-global/store/gateway/types'
import type {
  DataDecoded,
  SwapOrderTransactionInfo,
  SwapTransferTransactionInfo,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { StartTimeValue } from '@safe-global/store/gateway/types'
import OrderId from '../OrderId'
import { type ReactElement } from 'react'
import { compareAsc } from 'date-fns'
import { getLimitPrice, getOrderClass, getSlippageInPercent } from '../../helpers/utils'
import EthHashInfo from '@/components/common/EthHashInfo'
import NamedAddress from '@/components/common/NamedAddressInfo'
import { OrderFeeConfirmationView } from './OrderFeeConfirmationView'
import { isSettingTwapFallbackHandler } from '../../helpers/utils'
import { SwapOrderConfirmationViewView } from '@views/features/swap/components/SwapOrderConfirmationView/SwapOrderConfirmationViewView'

type SwapOrderProps = {
  order: SwapOrderTransactionInfo | SwapTransferTransactionInfo | TwapOrderTransactionInfo
  settlementContract: string
  decodedData?: DataDecoded | null
}

const SwapOrderConfirmation = ({ order, decodedData, settlementContract }: SwapOrderProps): ReactElement => {
  const { owner, validUntil, receiver } = order

  const isTwapOrder = order.type === TransactionInfoType.TWAP_ORDER

  const limitPrice = getLimitPrice(order)
  const orderClass = getOrderClass(order)
  const expires = new Date(validUntil * 1000)
  const now = new Date()

  const slippage = getSlippageInPercent(order)
  const isChangingFallbackHandler = decodedData && isSettingTwapFallbackHandler(decodedData)
  const explorerUrl = !isTwapOrder ? order.explorerUrl : undefined

  return (
    <SwapOrderConfirmationViewView
      order={order}
      limitPrice={limitPrice}
      isNotExpired={compareAsc(now, expires) !== 1}
      showSlippage={orderClass !== 'limit'}
      slippage={slippage}
      showFallbackHandlerWarning={!!isChangingFallbackHandler}
      showRecipient={!!receiver && owner !== receiver}
      isStartAtMiningTime={isTwapOrder && order.startTime.startType === StartTimeValue.AT_MINING_TIME}
      startEpoch={
        isTwapOrder && order.startTime.startType === StartTimeValue.AT_EPOCH ? order.startTime.epoch : undefined
      }
      orderId={!isTwapOrder && <OrderId orderId={order.uid} href={explorerUrl!} />}
      feeRow={
        <OrderFeeConfirmationView key="SurplusFee" order={order as { fullAppData?: Record<string, unknown> | null }} />
      }
      interactWith={
        <NamedAddress address={settlementContract} onlyName hasExplorer shortAddress={false} avatarSize={24} />
      }
      recipient={receiver && <EthHashInfo address={receiver} hasExplorer={true} avatarSize={24} />}
    />
  )
}

export default SwapOrderConfirmation
