import type { ReactElement, ReactNode } from 'react'
import type {
  SwapOrderTransactionInfo,
  SwapTransferTransactionInfo,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatDateTime, formatTimeInWords, getPeriod } from '@safe-global/utils/utils/date'
import { Fragment } from 'react'
import { DataRow } from '@/components/common/Table/DataRow'
import { DataTable } from '@/components/common/Table/DataTable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import SwapTokens from '@/features/swap/components/SwapTokens'
import AlertIcon from '@/public/images/common/alert.svg'
import css from './styles.module.css'
import { PartDuration } from '@views/features/swap/components/SwapOrder/rows/PartDuration'
import { PartSellAmount } from '@views/features/swap/components/SwapOrder/rows/PartSellAmount'
import { PartBuyAmount } from '@views/features/swap/components/SwapOrder/rows/PartBuyAmount'
import { TwapFallbackHandlerWarning } from '@views/features/swap/components/TwapFallbackHandlerWarning'

export type SwapOrderConfirmationViewViewProps = {
  order: SwapOrderTransactionInfo | SwapTransferTransactionInfo | TwapOrderTransactionInfo
  limitPrice: number
  isNotExpired: boolean
  showSlippage: boolean
  slippage: string
  showFallbackHandlerWarning: boolean
  showRecipient: boolean
  isStartAtMiningTime: boolean
  startEpoch?: number
  orderId: ReactNode
  feeRow: ReactElement
  interactWith: ReactNode
  recipient: ReactNode
}

export const SwapOrderConfirmationViewView = ({
  order,
  limitPrice,
  isNotExpired,
  showSlippage,
  slippage,
  showFallbackHandlerWarning,
  showRecipient,
  isStartAtMiningTime,
  startEpoch,
  orderId,
  feeRow,
  interactWith,
  recipient,
}: SwapOrderConfirmationViewViewProps): ReactElement => {
  const { kind, validUntil, sellToken, buyToken, sellAmount, buyAmount } = order
  const isSellOrder = kind === 'sell'

  return (
    <>
      {showFallbackHandlerWarning && <TwapFallbackHandlerWarning />}

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

          isNotExpired ? (
            <DataRow datatestid="expiry" key="Expiry" title="Expiry">
              <Typography>
                <span className="font-bold">{formatTimeInWords(validUntil * 1000)}</span> (
                {formatDateTime(validUntil * 1000)})
              </Typography>
            </DataRow>
          ) : (
            <DataRow key="Expiry" title="Expiry">
              {formatDateTime(validUntil * 1000)}
            </DataRow>
          ),
          showSlippage ? (
            <DataRow datatestid="slippage" key="Slippage" title="Slippage">
              {slippage}%
            </DataRow>
          ) : (
            <Fragment key="none" />
          ),
          order.type !== 'TwapOrder' ? (
            <DataRow datatestid="order-id" key="Order ID" title="Order ID">
              {orderId}
            </DataRow>
          ) : (
            <Fragment key="no-order-id" />
          ),
          feeRow,
          <DataRow datatestid="interact-wth" key="Interact with" title="Interact with">
            {interactWith}
          </DataRow>,
          showRecipient ? (
            <Fragment key="recipient-block">
              <DataRow datatestid="recipient" key="recipient-address" title="Recipient">
                {recipient}
              </DataRow>
              <div key="recipient">
                <Alert data-testid="recipient-alert" variant="warning" outlined={false}>
                  <AlertIcon />
                  <AlertDescription>
                    <Typography variant="paragraph-small">
                      <Typography variant="paragraph-small-bold" className="inline">
                        Order recipient address differs from order owner.
                      </Typography>{' '}
                      Double check the address to prevent fund loss.
                    </Typography>
                  </AlertDescription>
                </Alert>
              </div>
            </Fragment>
          ) : (
            <Fragment key="no-recipient" />
          ),
        ]}
      />

      {order.type === 'TwapOrder' && (
        <div className={css.partsBlock}>
          <DataTable
            rows={[
              <Typography key="title" variant="paragraph" className={css.partsBlockTitle}>
                <strong>
                  Order will be split in{' '}
                  <span className={css.numberOfPartsLabel}>{order.numberOfParts} equal parts</span>
                </strong>
              </Typography>,
              <PartSellAmount order={order} addonText="per part" key="sell_part" />,
              <PartBuyAmount order={order} addonText="per part" key="buy_part" />,
              <DataRow title="Start time" key="Start time">
                {isStartAtMiningTime && 'Now'}
                {startEpoch !== undefined && `At block number: ${startEpoch}`}
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
