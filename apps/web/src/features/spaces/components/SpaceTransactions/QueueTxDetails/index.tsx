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
import {
  isBridgeOrderTxInfo,
  isCancellationTxInfo,
  isExecTxInfo,
  isLifiSwapTxInfo,
  isNestedConfirmationTxInfo,
  isSettingsChangeTxInfo,
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
      <span className="flex min-w-0 items-center gap-1 whitespace-nowrap">
        <Amount value={txInfo.fromAmount} token={txInfo.fromToken} />
        <span className="shrink-0">→</span>
        <Amount value={txInfo.toAmount} token={txInfo.toToken} />
      </span>
    )
  }

  return (
    <span className="block min-w-0 truncate">
      <TxInfo info={txInfo} />
    </span>
  )
}

const QueueTxDetails = { Type: QueueTxType, Summary: QueueTxSummary }

export default QueueTxDetails
