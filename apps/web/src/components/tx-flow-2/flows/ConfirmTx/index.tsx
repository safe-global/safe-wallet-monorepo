import { isSwapOrderTxInfo } from '@/utils/transaction-guards'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import ConfirmProposedTx from './ConfirmProposedTx'
import { useTransactionType } from '@/hooks/useTransactionType'
import SwapIcon from '@/public/images/common/swap.svg'
import { useMemo } from 'react'
import { isExecutable, isMultisigExecutionInfo, isSignableBy } from '@/utils/transaction-guards'
import { useSigner } from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { createDefaultTxFlow } from '../../createTxFlow'

const ConfirmTxFlow = ({ txSummary }: { txSummary: TransactionSummary }) => {
  const { text } = useTransactionType(txSummary)
  const isSwapOrder = isSwapOrderTxInfo(txSummary.txInfo)
  const signer = useSigner()
  const { safe } = useSafeInfo()

  const txId = txSummary.id
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const canExecute = isExecutable(txSummary, signer?.address || '', safe)
  const canSign = isSignableBy(txSummary, signer?.address || '')

  const TxFlow = useMemo(
    () => createDefaultTxFlow<undefined>(({ onSubmit }) => <ConfirmProposedTx txNonce={txNonce} onSubmit={onSubmit} />),
    [txNonce],
  )

  return (
    <TxFlow
      icon={isSwapOrder && SwapIcon}
      subtitle={<>{text}&nbsp;</>}
      txId={txId}
      isExecutable={canExecute}
      onlyExecute={!canSign}
      txSummary={txSummary}
      showMethodCall
    />
  )
}

export default ConfirmTxFlow
