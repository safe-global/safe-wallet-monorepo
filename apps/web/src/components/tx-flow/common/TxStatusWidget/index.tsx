import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { useContext } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo, isSignableBy, isConfirmableBy } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useAlreadySigned } from '@/components/tx/shared/hooks'
import { TxStatusWidgetView } from '@views/components/tx-flow/common/TxStatusWidget/TxStatusWidgetView'

const TxStatusWidget = ({
  txSummary,
  isBatch = false,
  isMessage = false,
  isLastStep = false,
}: {
  txSummary?: Transaction
  isBatch?: boolean
  isMessage?: boolean
  isLastStep?: boolean
}) => {
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const { nonceNeeded, safeTx } = useContext(SafeTxContext)
  const { threshold } = safe
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const isProposing = isProposer && !isSafeOwner
  const isAwaitingExecution = txSummary?.txStatus === TransactionStatus.AWAITING_EXECUTION

  const { executionInfo = undefined } = txSummary || {}
  const { confirmationsSubmitted = 0 } = isMultisigExecutionInfo(executionInfo) ? executionInfo : {}

  const canConfirm = txSummary
    ? isConfirmableBy(txSummary, wallet?.address || '')
    : safe.threshold === 1 && !isProposing

  const canSign = txSummary ? isSignableBy(txSummary, wallet?.address || '') : !isProposing
  const hasSigned = useAlreadySigned(safeTx)
  const showSignStep = threshold === 1 && !isBatch && !isMessage

  return (
    <TxStatusWidgetView
      isBatch={isBatch}
      isMessage={isMessage}
      isLastStep={isLastStep}
      canConfirm={canConfirm}
      canSign={canSign}
      nonceNeeded={nonceNeeded}
      confirmationsSubmitted={confirmationsSubmitted}
      threshold={threshold}
      hasSigned={hasSigned}
      showSignStep={showSignStep}
      isAwaitingExecution={isAwaitingExecution}
    />
  )
}

export default TxStatusWidget
