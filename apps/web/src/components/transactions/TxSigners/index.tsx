import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement } from 'react'
import { AuditRow, useCopyToClipboard } from '@/components/common/AuditLog'

import useWallet from '@/hooks/wallets/useWallet'
import useIsPending from '@/hooks/useIsPending'
import {
  isCancellationTxInfo,
  isExecutable,
  isModuleDetailedExecutionInfo,
  isMultisigDetailedExecutionInfo,
} from '@/utils/transaction-guards'

import useSafeInfo from '@/hooks/useSafeInfo'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLinkWrapper from '@/components/transactions/TxShareLink/TxShareLink'
import { useLoadFeature } from '@/features/__core__'
import { SafenetChecksFeature, useIsSafenetChecksEnabled } from '@/features/safenet-checks'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useAsync from '@safe-global/utils/hooks/useAsync'
import {
  CopyTxHashButtonView,
  TxAuditLogActionsView,
  TxSignersExecutedView,
  TxSignersModuleView,
  TxSignersView,
  type TxSignersAuditRowProps,
} from '@views/components/transactions/TxSigners/TxSignersView'

type TxSignersProps = {
  txDetails: TransactionDetails
  txSummary: Transaction
  isTxFromProposer: boolean
  proposer?: string
  isExpired?: boolean
}

const CopyTxHashButton = ({ txHash }: { txHash?: string | null }) => {
  const [copied, handleCopy] = useCopyToClipboard(txHash)

  return <CopyTxHashButtonView txHash={txHash} copied={copied} onCopy={handleCopy} />
}

const TxAuditLogActions = ({
  txId,
  txHash,
  explorerLink,
}: {
  txId: string
  txHash?: string | null
  explorerLink?: { title: string; href: string }
}) => (
  <TxAuditLogActionsView
    copyTxHashButton={<CopyTxHashButton txHash={txHash} />}
    renderShareLink={(children) => (
      <TxShareLinkWrapper id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
        {children}
      </TxShareLinkWrapper>
    )}
    explorerLink={explorerLink}
  />
)

const renderAuditRow = (props: TxSignersAuditRowProps) => <AuditRow {...props} />

const TxSigners = ({
  txDetails,
  txSummary,
  isTxFromProposer,
  proposer,
  isExpired,
}: TxSignersProps): ReactElement | null => {
  const { detailedExecutionInfo, txInfo, txId } = txDetails
  const isPending = useIsPending(txId)
  const txStatus = useTransactionStatus(txSummary)
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const addressBook = useAddressBook()
  const chain = useCurrentChain()
  const { SafenetAuditRow } = useLoadFeature(SafenetChecksFeature)
  const isSafenetEnabled = useIsSafenetChecksEnabled()

  const isMultisig = isMultisigDetailedExecutionInfo(detailedExecutionInfo)
  const isModule = isModuleDetailedExecutionInfo(detailedExecutionInfo)

  // Subscribed here as well as inside the row (same cache entry, one chain
  // read) so the sibling rows' isLast can account for the Safenet step. The
  // undefined hash skips the read entirely while the flag is off.
  const safenetHash = isSafenetEnabled && isMultisig ? detailedExecutionInfo.safeTxHash : undefined
  const safenetCheck = useSafenetCheck(safenetHash, isMultisig ? detailedExecutionInfo.submittedAt : null, {
    chainId: safe.chainId,
    safeAddress: safe.address.value,
  })
  // Must mirror SafenetAuditRow's own render gate, or the connector math drifts.
  const showsSafenetRow =
    !!safenetHash && !!safenetCheck.snapshot && safenetCheck.publicStatus !== CheckStatus.UNAVAILABLE

  // Lookup the EOA that submitted the transaction on-chain (for module and incoming txs)
  const readOnlyProvider = useWeb3ReadOnly()
  const [onChainFrom] = useAsync(async () => {
    if (isMultisig || !txDetails.txHash || !readOnlyProvider) return undefined
    const tx = await readOnlyProvider.getTransaction(txDetails.txHash)
    return tx?.from
  }, [isMultisig, txDetails.txHash, readOnlyProvider])

  const explorerLink = chain && txDetails.txHash ? getBlockExplorerLink(chain, txDetails.txHash) : undefined

  const resolveName = (address: string | undefined, apiFallback?: string | null): string | undefined =>
    address ? addressBook[address] || apiFallback || undefined : undefined

  if (!isMultisig && !isModule) {
    if (!txDetails.executedAt) return null

    return (
      <TxSignersExecutedView
        actions={<TxAuditLogActions txId={txId} txHash={txDetails.txHash} explorerLink={explorerLink} />}
        renderAuditRow={renderAuditRow}
        executedAt={txDetails.executedAt}
        executor={{ address: onChainFrom, name: resolveName(onChainFrom) }}
      />
    )
  }

  // Module-executed transaction: Created (initiator EOA) + Executed (module)
  if (isModule && detailedExecutionInfo) {
    const moduleAddress = detailedExecutionInfo.address.value
    // "AllowanceModule" → "Allowance Module"
    const moduleName = detailedExecutionInfo.address.name?.replace(/([a-z])([A-Z])/g, '$1 $2')

    return (
      <TxSignersModuleView
        actions={<TxAuditLogActions txId={txId} txHash={txDetails.txHash} explorerLink={explorerLink} />}
        renderAuditRow={renderAuditRow}
        executedAt={txDetails.executedAt}
        creator={{ address: onChainFrom, name: resolveName(onChainFrom) }}
        module={{ address: moduleAddress, name: resolveName(moduleAddress, moduleName) }}
      />
    )
  }

  // Multisig transaction: full audit log with confirmations
  // At this point isMultisig is true and both !isMultisig and isModule branches have returned
  const multisigInfo = detailedExecutionInfo!
  const { confirmations, confirmationsRequired, executor, submittedAt } = multisigInfo

  const canExecute = wallet?.address ? isExecutable(txSummary, wallet.address, safe) : false
  const confirmationsNeeded = confirmationsRequired - confirmations.length
  const isConfirmed = confirmationsNeeded <= 0 || canExecute

  const isCancellation = isCancellationTxInfo(txInfo)

  const showExecutionRow = isConfirmed || !!executor || txDetails.txStatus !== 'AWAITING_CONFIRMATIONS'

  return (
    <TxSignersView
      actions={<TxAuditLogActions txId={txId} txHash={txDetails.txHash} explorerLink={explorerLink} />}
      renderAuditRow={renderAuditRow}
      executedAt={txDetails.executedAt}
      isTxFromProposer={isTxFromProposer}
      isExpired={isExpired}
      isCancellation={isCancellation}
      isConfirmed={isConfirmed}
      isPending={isPending}
      txStatus={txStatus}
      proposer={{
        address: proposer,
        name: resolveName(proposer, multisigInfo.proposer?.name || multisigInfo.proposedByDelegate?.name),
      }}
      submittedAt={submittedAt}
      confirmationsRequired={confirmationsRequired}
      confirmations={confirmations.map(({ signer, submittedAt: signedAt }) => ({
        address: signer.value,
        name: resolveName(signer.value, signer.name),
        submittedAt: signedAt,
      }))}
      hasExecutor={!!executor}
      executor={{ address: executor?.value, name: resolveName(executor?.value, executor?.name) }}
      showsSafenetRow={showsSafenetRow}
      showExecutionRow={showExecutionRow}
      safenetRow={
        // Safenet check step (PRD: between the signatures and execution); stubbed to null while the flag is off.
        <SafenetAuditRow
          safeTxHash={multisigInfo.safeTxHash}
          chainId={safe.chainId}
          timestampMs={submittedAt}
          isLast={!showExecutionRow}
        />
      }
    />
  )
}

export default TxSigners
