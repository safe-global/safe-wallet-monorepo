import type { JSX, ReactNode } from 'react'
import { DataTable } from '@/components/common/Table/DataTable'
import { type SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DataRow } from '@/components/common/Table/DataRow'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import TokenAmount from '@/components/common/TokenAmount'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

export const PREVIEW_SWAP_AMOUNT_LABELS = { first: 'Sell', second: 'For at least' }

export const PreviewSwapAmountView = ({ swapTokens }: { swapTokens: ReactNode }) => <div key="amount">{swapTokens}</div>

const ListSwapAmount = ({ txInfo }: { txInfo: SwapTransactionInfo }) => (
  <DataRow datatestid="amount" key="amount" title="Amount">
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-center gap-2">
        Sell{' '}
        <TokenAmount
          value={txInfo.fromAmount}
          decimals={txInfo.fromToken.decimals}
          logoUri={txInfo.fromToken.logoUri ?? ''}
          tokenSymbol={txInfo.fromToken.symbol}
        />
      </div>
      <div className="flex flex-row items-center gap-2">
        For{' '}
        <TokenAmount
          value={txInfo.toAmount}
          decimals={txInfo.toToken.decimals}
          logoUri={txInfo.toToken.logoUri ?? ''}
          tokenSymbol={txInfo.toToken.symbol}
        />
      </div>
    </div>
  </DataRow>
)

export type LifiSwapTransactionViewProps = {
  txInfo: SwapTransactionInfo
  previewAmount?: JSX.Element
  exchangeRate: number
  totalFee: string
  receiver: ReactNode
}

export const LifiSwapTransactionView = ({
  txInfo,
  previewAmount,
  exchangeRate,
  totalFee,
  receiver,
}: LifiSwapTransactionViewProps) => {
  const rows = [
    previewAmount ?? <ListSwapAmount key="amount" txInfo={txInfo} />,
    <DataRow datatestid="price" key="price" title="Price">
      1 {txInfo.fromToken.symbol} = {formatAmount(exchangeRate)} {txInfo.toToken!.symbol}
    </DataRow>,
    <DataRow datatestid="receiver" key="Receiver" title="Receiver">
      {receiver}
    </DataRow>,
    <DataRow datatestid="total-fee" key="fees" title="Fees">
      {formatAmount(totalFee)} {txInfo.fromToken.symbol}
    </DataRow>,
  ]

  if (txInfo.lifiExplorerUrl) {
    rows.push(
      <DataRow datatestid="lifi-explorer-url" key="lifi-explorer-url" title="Lifi Explorer">
        <ExternalLink className={css.externalLink} href={txInfo.lifiExplorerUrl}>
          View in LiFi explorer
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
