import type { ReactElement, ReactNode } from 'react'
import type {
  SettingsChangeTransaction,
  TokenInfo,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import QueueSummary from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSummary'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import css from '@safe-global/views/components/transactions/TxType/styles.module.css'
import { Code, GitMerge, Settings, type LucideIcon } from 'lucide-react'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import TokenAmount from '@/components/common/TokenAmount'
import TxInfo from '@/components/transactions/TxInfo'
import { TxTypeIcon } from '@/components/transactions/TxType'
import { useTransactionType } from '@/hooks/useTransactionType'
import QueueTypeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueTypeTag'
import { useChain, useCurrentChain } from '@/hooks/useChains'
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
  isMultiSendTxInfo,
  isMultisigExecutionInfo,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
  isTwapOrderTxInfo,
} from '@/utils/transaction-guards'
import {
  formatQueueAmount,
  getNonce,
  getQueueAmount,
  getQueueTypeLabel,
  getSettingsSummary,
  getTypeHint,
  POLICY_CHANGES,
  toQueueAmount,
  WARNING_LABELS,
  type QueueAmount,
  type QueueTypeLabel,
} from '../utils'

const TYPE_ICONS: Record<QueueTypeLabel, LucideIcon> = {
  Settings,
  Contract: Code,
  Nested: GitMerge,
}

const QueueTxType = ({ tx }: { tx: Transaction }): ReactElement => {
  const label = getQueueTypeLabel(tx)
  const type = useTransactionType(tx)
  const Icon = label ? TYPE_ICONS[label] : undefined
  return (
    <QueueTypeTag title={label ?? type.text} hint={getTypeHint(tx)}>
      {Icon ? (
        <span className={css.txType}>
          <Icon className="size-4" strokeWidth={ICON_STROKE} />
        </span>
      ) : (
        <TxTypeIcon tx={tx} />
      )}
      <span className="min-w-0 truncate">{label ?? type.text}</span>
    </QueueTypeTag>
  )
}

const WithHint = QueueSummary

const ORDER_CLASSES: Record<string, string> = { market: 'Market order', limit: 'Limit order' }

const getOrderHint = (info: OrderTransactionInfo): string | undefined =>
  isTwapOrderTxInfo(info) ? 'TWAP order' : ORDER_CLASSES[info.orderClass]

const getSettingsHint = (tx: Transaction, txInfo: SettingsChangeTransaction): string | undefined => {
  const { settingsInfo } = txInfo
  if (!settingsInfo) return undefined
  if (settingsInfo.type === 'ADD_OWNER' || settingsInfo.type === 'REMOVE_OWNER') {
    return `Threshold ${settingsInfo.threshold} after the change`
  }
  if (settingsInfo.type === 'CHANGE_THRESHOLD' && isMultisigExecutionInfo(tx.executionInfo)) {
    return `Threshold ${tx.executionInfo.confirmationsRequired} → ${settingsInfo.threshold}`
  }
  return POLICY_CHANGES.includes(settingsInfo.type) ? WARNING_LABELS.policyChange : undefined
}

// The summary's tooltip says the amount in full, so the amount drops its own
const Amount = ({ amount }: { amount: QueueAmount }): ReactElement => (
  <TokenAmount
    value={amount.value}
    decimals={amount.decimals}
    tokenSymbol={amount.rowSymbol ?? amount.symbol}
    logoUri={amount.logoUri}
    fallbackSrc={amount.fallbackSrc}
    noTooltip
  />
)

const BridgeSummary = ({ info }: { info: Extract<Transaction['txInfo'], { type: 'SwapAndBridge' }> }): ReactElement => {
  const destination = useChain(info.toChain)
  const amount = toQueueAmount(info.fromAmount, info.fromToken)
  return (
    <WithHint hint={`To ${destination?.chainName ?? 'an unknown network'}`} label={formatQueueAmount(amount)}>
      <Amount amount={amount} />
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
const OrderSummary = ({ info }: { info: OrderTransactionInfo }): ReactElement => {
  const bought = toQueueAmount(info.buyAmount, info.buyToken)
  const sold = toQueueAmount(info.sellAmount, info.sellToken)
  return info.kind === 'buy' ? (
    <WithHint hint={getOrderHint(info)} label={`${info.sellToken.symbol} → ${formatQueueAmount(bought)}`}>
      <Exchange from={<TokenSymbol token={info.sellToken} />} to={<Amount amount={bought} />} />
    </WithHint>
  ) : (
    <WithHint hint={getOrderHint(info)} label={`${formatQueueAmount(sold)} → ${info.buyToken.symbol}`}>
      <Exchange from={<Amount amount={sold} />} to={<TokenSymbol token={info.buyToken} />} />
    </WithHint>
  )
}

const getDefaultHint = (txInfo: Transaction['txInfo']): string | undefined => {
  if (isMultiSendTxInfo(txInfo)) return `${txInfo.actionCount} actions in one transaction`
  if (isStakingTxDepositInfo(txInfo)) {
    return `Deposits into ${txInfo.numValidators} validator${maybePlural(txInfo.numValidators)} with Kiln`
  }
  if (isStakingTxWithdrawInfo(txInfo)) return 'Claims exited stake from Kiln'
  return undefined
}

// What TxInfo shows for the types without an amount, as text
const getPlainSummary = (txInfo: Transaction['txInfo']): string | undefined => {
  if (isMultiSendTxInfo(txInfo)) return `${txInfo.actionCount} action${maybePlural(txInfo.actionCount)}`
  if (!isCustomTxInfo(txInfo)) return undefined
  // Read the method before the migration guard, which narrows txInfo to never when it returns false
  const { methodName } = txInfo
  return isMigrateToL2TxInfo(txInfo) ? 'Migrate base contract' : (methodName ?? undefined)
}

const QueueTxSummary = ({ tx }: { tx: Transaction }): ReactElement => {
  const { txInfo } = tx
  // TxInfo reads the native token from the current chain too
  const nativeCurrency = useCurrentChain()?.nativeCurrency

  if (isSettingsChangeTxInfo(txInfo)) {
    return <WithHint hint={getSettingsHint(tx, txInfo)}>{getSettingsSummary(txInfo)}</WithHint>
  }

  if (isCancellationTxInfo(txInfo)) {
    const nonce = getNonce(tx)
    return (
      <WithHint
        hint={
          <>
            {`Rejects #${nonce}. If this executes, nothing else at #${nonce} can.`}&nbsp;
            <ExternalLink href={HelpCenterArticle.CANCELLING_TRANSACTIONS}>
              Learn more about on-chain rejections
            </ExternalLink>
          </>
        }
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
    const from = toQueueAmount(txInfo.fromAmount, txInfo.fromToken)
    const to = toQueueAmount(txInfo.toAmount, txInfo.toToken)
    return (
      <WithHint label={`${formatQueueAmount(from)} → ${formatQueueAmount(to)}`}>
        <Exchange from={<Amount amount={from} />} to={<Amount amount={to} />} />
      </WithHint>
    )
  }

  if (isOrderTxInfo(txInfo)) return <OrderSummary info={txInfo} />

  if (isStakingTxExitInfo(txInfo)) {
    return (
      <WithHint hint="Asks Kiln to exit these validators. You claim the ETH once they have exited.">
        {`${txInfo.numValidators} validator${maybePlural(txInfo.numValidators)}`}
      </WithHint>
    )
  }

  // The gateway leaves the method out when it can't decode the call data
  if (isCustomTxInfo(txInfo) && !txInfo.methodName && !isMigrateToL2TxInfo(txInfo)) {
    return <WithHint>Unknown method</WithHint>
  }

  // The type tag already says which way the tokens go, so the amount has no sign
  const amount = getQueueAmount(txInfo, nativeCurrency)
  if (amount) {
    return (
      <WithHint hint={getDefaultHint(txInfo)} label={formatQueueAmount(amount)}>
        <Amount amount={amount} />
      </WithHint>
    )
  }

  return (
    <WithHint hint={getDefaultHint(txInfo)} label={getPlainSummary(txInfo)}>
      <TxInfo info={txInfo} omitSign />
    </WithHint>
  )
}

const QueueTxDetails = { Type: QueueTxType, Summary: QueueTxSummary }

export default QueueTxDetails
