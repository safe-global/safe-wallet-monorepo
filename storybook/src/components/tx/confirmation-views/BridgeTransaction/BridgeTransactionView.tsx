import type { ReactNode } from 'react'
import { DataRow } from '@/components/common/Table/DataRow'
import { DataTable } from '@/components/common/Table/DataTable'
import TokenAmount from '@/components/common/TokenAmount'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

const BridgeTxRecipientRow = ({ recipient }: { recipient: ReactNode }) => {
  return (
    <DataRow datatestid="recipient" key="recipient" title="Recipient">
      <div className="flex flex-col">{recipient}</div>
    </DataRow>
  )
}

type RowsArgs = {
  txInfo: BridgeAndSwapTransactionInfo
  actualFromAmount: string
  toChainIndicator: ReactNode
}

function pendingBridgeTransactionRows({ txInfo, actualFromAmount, toChainIndicator }: RowsArgs) {
  return [
    <DataRow datatestid="amount" key="amount" title="Amount">
      <div className="flex flex-row items-center gap-2">
        Sending{' '}
        <TokenAmount
          value={actualFromAmount}
          decimals={txInfo.fromToken.decimals}
          logoUri={txInfo.fromToken.logoUri ?? ''}
          tokenSymbol={txInfo.fromToken.symbol}
        />{' '}
        to {toChainIndicator}
      </div>
    </DataRow>,
  ]
}

function failedBridgeTransactionRows({ txInfo, actualFromAmount, toChainIndicator }: RowsArgs) {
  return [
    <DataRow datatestid="amount" key="amount" title="Amount">
      <div className="flex flex-row items-center gap-2">
        Failed to send{' '}
        <TokenAmount
          value={actualFromAmount}
          decimals={txInfo.fromToken.decimals}
          logoUri={txInfo.fromToken.logoUri ?? ''}
          tokenSymbol={txInfo.fromToken.symbol}
        />{' '}
        to {toChainIndicator}
      </div>
    </DataRow>,
    <DataRow datatestid="substatus" key="substatus" title="Substatus">
      {txInfo.substatus}
    </DataRow>,
  ]
}

function successfulBridgeTransactionRows({
  txInfo,
  actualFromAmount,
  chainId,
  exchangeRate,
  fromChainName,
  toChainName,
}: RowsArgs & { chainId: string; exchangeRate?: number; fromChainName?: string; toChainName?: string }) {
  const rows = []

  rows.push(
    <DataRow datatestid="amount" key="amount" title="Amount">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          Sell{' '}
          <TokenAmount
            value={actualFromAmount}
            decimals={txInfo.fromToken.decimals}
            logoUri={txInfo.fromToken.logoUri ?? ''}
            tokenSymbol={txInfo.fromToken.symbol}
            chainId={chainId}
          />{' '}
          on {fromChainName ?? 'Unknown Chain'}
        </div>
        <div className="flex flex-row items-center gap-2">
          {txInfo.toToken && txInfo.toAmount ? (
            <>
              For{' '}
              <TokenAmount
                value={txInfo.toAmount}
                decimals={txInfo.toToken.decimals}
                logoUri={txInfo.toToken.logoUri ?? ''}
                tokenSymbol={txInfo.toToken.symbol}
                chainId={txInfo.toChain}
              />{' '}
              on {toChainName ?? 'Unknown Chain'}
            </>
          ) : (
            <>Could not find buy token information.</>
          )}
        </div>
      </div>
    </DataRow>,
  )
  if (exchangeRate) {
    rows.push(
      <DataRow datatestid="exchange-rate" key="Exchange Rate" title="Exchange Rate">
        1 {txInfo.fromToken.symbol} = {formatAmount(exchangeRate)} {txInfo.toToken!.symbol}
      </DataRow>,
    )
  }

  return rows
}

export type BridgeTransactionViewProps = {
  txInfo: BridgeAndSwapTransactionInfo
  chainId: string
  actualFromAmount: string
  totalFee: string
  exchangeRate?: number
  fromChainName?: string
  toChainName?: string
  toChainIndicator: ReactNode
  recipient: ReactNode
}

export function BridgeTransactionView({
  txInfo,
  chainId,
  actualFromAmount,
  totalFee,
  exchangeRate,
  fromChainName,
  toChainName,
  toChainIndicator,
  recipient,
}: BridgeTransactionViewProps) {
  const rowsArgs = { txInfo, actualFromAmount, toChainIndicator }

  let rows = []
  if (txInfo.status === 'PENDING' || txInfo.status === 'AWAITING_EXECUTION') {
    rows.push(...pendingBridgeTransactionRows(rowsArgs))
  } else if (txInfo.status === 'FAILED') {
    rows.push(...failedBridgeTransactionRows(rowsArgs))
  } else if (txInfo.status === 'DONE') {
    rows.push(...successfulBridgeTransactionRows({ ...rowsArgs, chainId, exchangeRate, fromChainName, toChainName }))
  }
  rows.push(
    <BridgeTxRecipientRow key="recipient" recipient={recipient} />,
    <DataRow datatestid="total-fee" key="fees" title="Fees">
      {formatAmount(totalFee)} {txInfo.fromToken.symbol}
    </DataRow>,
  )

  if (txInfo.explorerUrl) {
    rows.push(
      <DataRow datatestid="lifi-explorer-url" key="lifi-explorer-url" title="Lifi Explorer">
        <ExternalLink className={css.externalLink} href={txInfo.explorerUrl}>
          View in LiFi Explorer
        </ExternalLink>
      </DataRow>,
    )
  }

  return (
    <div className="flex flex-col">
      <DataTable rows={rows} />
    </div>
  )
}
