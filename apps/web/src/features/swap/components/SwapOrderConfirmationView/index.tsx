import OrderId from '@/features/swap/components/OrderId'
import { formatDateTime, formatTimeInWords, getPeriod } from '@safe-global/utils/utils/date'
import { Fragment, type ReactElement } from 'react'
import { DataRow } from '@/components/common/Table/DataRow'
import { DataTable } from '@/components/common/Table/DataTable'
import { compareAsc } from 'date-fns'
import { Alert, Typography } from '@mui/material'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { getLimitPrice, getOrderClass, getSlippageInPercent } from '@/features/swap/helpers/utils'
import type { DataDecoded, SwapOrder, SwapTransferOrder, TwapOrder } from '@safe-global/safe-gateway-typescript-sdk'
import { StartTimeValue, TransactionInfoType } from '@safe-global/safe-gateway-typescript-sdk'
import SwapTokens from '@/features/swap/components/SwapTokens'
import AlertIcon from '@/public/images/common/alert.svg'
import EthHashInfo from '@/components/common/EthHashInfo'
import css from './styles.module.css'
import NamedAddress from '@/components/common/NamedAddressInfo'
import { PartDuration } from '@/features/swap/components/SwapOrder/rows/PartDuration'
import { PartSellAmount } from '@/features/swap/components/SwapOrder/rows/PartSellAmount'
import { PartBuyAmount } from '@/features/swap/components/SwapOrder/rows/PartBuyAmount'
import { OrderFeeConfirmationView } from '@/features/swap/components/SwapOrderConfirmationView/OrderFeeConfirmationView'
import { isSettingTwapFallbackHandler } from '@/features/swap/helpers/utils'
import { TwapFallbackHandlerWarning } from '@/features/swap/components/TwapFallbackHandlerWarning'

type SwapOrderProps = {
  order: SwapOrder | SwapTransferOrder | TwapOrder
  settlementContract: string
  decodedData?: DataDecoded
}

export const SwapOrderConfirmation = ({ order, decodedData, settlementContract }: SwapOrderProps): ReactElement => {
  const { owner, kind, validUntil, sellToken, buyToken, sellAmount, buyAmount, explorerUrl, receiver } = order

  const isTwapOrder = order.type === TransactionInfoType.TWAP_ORDER

  const limitPrice = getLimitPrice(order)
  const orderClass = getOrderClass(order)
  const expires = new Date(validUntil * 1000)
  const now = new Date()

  const slippage = getSlippageInPercent(order)
  const isSellOrder = kind === 'sell'
  const isChangingFallbackHandler = decodedData && isSettingTwapFallbackHandler(decodedData)

  return (
    <>
      {isChangingFallbackHandler && <TwapFallbackHandlerWarning />}

      <DataTable
        header="Order details"
        rows={[
          <div key="amount" className={css.amount}>
            <SwapTokens
              first={{
                value: sellAmount,
                label: isSellOrder ? 'Sell' : 'For at most',
                tokenInfo: sellToken,
              }}
              second={{
                value: buyAmount,
                label: isSellOrder ? 'For at least' : 'Buy exactly',
                tokenInfo: buyToken,
              }}
            />
          </div>,

          <DataRow datatestid="limit-price" key="Limit price" title="Limit price">
            1 {buyToken.symbol} = {formatAmount(limitPrice)} {sellToken.symbol}
          </DataRow>,

          compareAsc(now, expires) !== 1 ? (
            <DataRow datatestid="expiry" key="Expiry" title="Expiry">
              <Typography>
                <Typography fontWeight={700} component="span">
                  {formatTimeInWords(validUntil * 1000)}
                </Typography>{' '}
                ({formatDateTime(validUntil * 1000)})
              </Typography>
            </DataRow>
          ) : (
            <DataRow key="Expiry" title="Expiry">
              {formatDateTime(validUntil * 1000)}
            </DataRow>
          ),
          orderClass !== 'limit' ? (
            <DataRow datatestid="slippage" key="Slippage" title="Slippage">
              {slippage}%
            </DataRow>
          ) : (
            <Fragment key="none" />
          ),
          !isTwapOrder ? (
            <DataRow datatestid="order-id" key="Order ID" title="Order ID">
              <OrderId orderId={order.uid} href={explorerUrl} />
            </DataRow>
          ) : (
            <></>
          ),
          <OrderFeeConfirmationView key="SurplusFee" order={order} />,
          <DataRow datatestid="interact-wth" key="Interact with" title="Interact with">
            <NamedAddress address={settlementContract} onlyName hasExplorer shortAddress={false} avatarSize={24} />
          </DataRow>,
          receiver && owner !== receiver ? (
            <>
              <DataRow datatestid="recipient" key="recipient-address" title="Recipient">
                <EthHashInfo address={receiver} hasExplorer={true} avatarSize={24} />
              </DataRow>
              <div key="recipient">
                <Alert data-testid="recipient-alert" severity="warning" icon={AlertIcon}>
                  <Typography variant="body2">
                    <Typography component="span" sx={{ fontWeight: 'bold' }}>
                      Order recipient address differs from order owner.
                    </Typography>{' '}
                    Double check the address to prevent fund loss.
                  </Typography>
                </Alert>
              </div>
            </>
          ) : (
            <></>
          ),
        ]}
      />

      {isTwapOrder && (
        <div className={css.partsBlock}>
          <DataTable
            rows={[
              <Typography key="title" variant="body1" className={css.partsBlockTitle}>
                <strong>
                  Order will be split in{' '}
                  <span className={css.numberOfPartsLabel}>{order.numberOfParts} equal parts</span>
                </strong>
              </Typography>,
              <PartSellAmount order={order} addonText="per part" key="sell_part" />,
              <PartBuyAmount order={order} addonText="per part" key="buy_part" />,
              <DataRow title="Start time" key="Start time">
                {order.startTime.startType === StartTimeValue.AT_MINING_TIME && 'Now'}
                {order.startTime.startType === StartTimeValue.AT_EPOCH && `At block number: ${order.startTime.epoch}`}
              </DataRow>,
              <PartDuration order={order} key="part_duration" />,
              <DataRow title="Total duration" key="total_duration">
                {getPeriod(+order.timeBetweenParts * +order.numberOfParts)}
              </DataRow>,
            ]}
          />
        </div>
      )}
    </>
  )
}

export default SwapOrderConfirmation
