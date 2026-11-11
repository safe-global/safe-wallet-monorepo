import type { ReactElement, ReactNode } from 'react'
import type { TokenInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import css from '@safe-global/views/components/transactions/TxType/styles.module.css'
import { Code, GitMerge, Settings, type LucideIcon } from 'lucide-react'
import TokenAmount from '@/components/common/TokenAmount'
import TxInfo from '@/components/transactions/TxInfo'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import { useChain } from '@/hooks/useChains'
import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import {
  isBridgeOrderTxInfo,
  isCancellationTxInfo,
  isCustomTxInfo,
  isExecTxInfo,
  isLifiSwapTxInfo,
  isMigrateToL2TxInfo,
  isNestedConfirmationTxInfo,
  isOrderTxInfo,
  isSettingsChangeTxInfo,
  isStakingTxExitInfo,
} from '@/utils/transaction-guards'
import { getNonce, getQueueTypeLabel, getSettingsSummary, type QueueTypeLabel } from '../utils'

const TYPE_ICONS: Record<QueueTypeLabel, LucideIcon> = {
  Settings,
  Contract: Code,
  Nested: GitMerge,
}

const QueueTxType = ({ tx }: { tx: Transaction }): ReactElement => {
  const label = getQueueTypeLabel(tx)
  if (!label) {
    return (
      <>
        <TxTypeIcon tx={tx} />
        <TxTypeText tx={tx} />
      </>
    )
  }
  const Icon = TYPE_ICONS[label]
  return (
    <>
      <span className={css.txType}>
        <Icon className="size-4" strokeWidth={ICON_STROKE} />
      </span>
      {label}
    </>
  )
}

const WithHint = ({ hint, children }: { hint?: string; children: ReactNode }): ReactElement => {
  if (!hint) return <span className="block min-w-0 truncate">{children}</span>
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{children}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

const Amount = ({ value, token }: { value: string; token: TokenInfo }): ReactElement => (
  <TokenAmount value={value} decimals={token.decimals} tokenSymbol={token.symbol} logoUri={token.logoUri} />
)

const BridgeSummary = ({ info }: { info: Extract<Transaction['txInfo'], { type: 'SwapAndBridge' }> }): ReactElement => {
  const destination = useChain(info.toChain)
  return (
    <WithHint hint={`To ${destination?.chainName ?? 'an unknown network'}`}>
      <Amount value={info.fromAmount} token={info.fromToken} />
    </WithHint>
  )
}

const Exchange = ({ from, to }: { from: ReactNode; to: ReactNode }): ReactElement => (
  <span className="flex min-w-0 items-center gap-1 whitespace-nowrap">
    {from}
    <span className="shrink-0">→</span>
    {to}
  </span>
)

const TokenSymbol = ({ token }: { token: TokenInfo }): ReactElement => (
  <b className="min-w-0 truncate">{token.symbol}</b>
)

// A sell order fixes the amount sold and a buy order the amount bought; the other side is only a limit
const OrderSummary = ({ info }: { info: OrderTransactionInfo }): ReactElement =>
  info.kind === 'buy' ? (
    <Exchange
      from={<TokenSymbol token={info.sellToken} />}
      to={<Amount value={info.buyAmount} token={info.buyToken} />}
    />
  ) : (
    <Exchange
      from={<Amount value={info.sellAmount} token={info.sellToken} />}
      to={<TokenSymbol token={info.buyToken} />}
    />
  )

const QueueTxSummary = ({ tx }: { tx: Transaction }): ReactElement => {
  const { txInfo } = tx

  if (isSettingsChangeTxInfo(txInfo)) {
    const { settingsInfo } = txInfo
    const hint =
      settingsInfo?.type === 'ADD_OWNER' || settingsInfo?.type === 'REMOVE_OWNER'
        ? `Threshold ${settingsInfo.threshold} after the change`
        : undefined
    return <WithHint hint={hint}>{getSettingsSummary(txInfo)}</WithHint>
  }

  if (isCancellationTxInfo(txInfo)) {
    const nonce = getNonce(tx)
    return (
      <WithHint
        hint={`An empty transaction at #${nonce}. Executing it cancels everything else at this nonce.`}
      >{`Cancels #${nonce}`}</WithHint>
    )
  }

  if (isNestedConfirmationTxInfo(txInfo)) {
    // The parent transaction's nonce isn't in the list response: approveHash only carries its hash
    return (
      <WithHint hint="Signs a transaction on another Safe this one is a signer of">
        {isExecTxInfo(txInfo) ? 'Executes a transaction' : 'Approves a transaction'}
      </WithHint>
    )
  }

  if (isBridgeOrderTxInfo(txInfo)) return <BridgeSummary info={txInfo} />

  if (isLifiSwapTxInfo(txInfo)) {
    return (
      <Exchange
        from={<Amount value={txInfo.fromAmount} token={txInfo.fromToken} />}
        to={<Amount value={txInfo.toAmount} token={txInfo.toToken} />}
      />
    )
  }

  if (isOrderTxInfo(txInfo)) return <OrderSummary info={txInfo} />

  if (isStakingTxExitInfo(txInfo)) {
    return (
      <span className="block min-w-0 truncate">{`${txInfo.numValidators} validator${maybePlural(txInfo.numValidators)}`}</span>
    )
  }

  // The gateway leaves the method out when it can't decode the call data
  if (isCustomTxInfo(txInfo) && !txInfo.methodName && !isMigrateToL2TxInfo(txInfo)) {
    return <span className="block min-w-0 truncate">Unknown method</span>
  }

  return (
    <span className="block min-w-0 truncate">
      {/* The type tag already says which way the tokens go */}
      <TxInfo info={txInfo} omitSign />
    </span>
  )
}

const QueueTxDetails = { Type: QueueTxType, Summary: QueueTxSummary }

export default QueueTxDetails
