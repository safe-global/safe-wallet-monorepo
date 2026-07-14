import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ReactElement } from 'react'
import { Copy } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import { AuditRow, AuditLogHeader, useCopyToClipboard } from '@/components/common/AuditLog'

import useWallet from '@/hooks/wallets/useWallet'
import useIsPending from '@/hooks/useIsPending'
import {
  isCancellationTxInfo,
  isExecutable,
  isModuleDetailedExecutionInfo,
  isMultisigDetailedExecutionInfo,
} from '@/utils/transaction-guards'
import ExplorerFallbackIcon from '@/public/images/common/link.svg'
import HashIcon from '@/public/images/common/hash.svg'

import useSafeInfo from '@/hooks/useSafeInfo'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { CopyDeeplinkLabels } from '@/services/analytics'
import TxShareLinkWrapper from '@/components/transactions/TxShareLink/TxShareLink'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useAsync from '@safe-global/utils/hooks/useAsync'

const WAITING_STATUSES = new Set([
  'Awaiting confirmations',
  'Awaiting execution',
  'Needs your confirmation',
  'Awaiting review',
])
const shortenAuditStatus = (status: string): string => (WAITING_STATUSES.has(status) ? 'Waiting' : status)

type TxSignersProps = {
  txDetails: TransactionDetails
  txSummary: Transaction
  isTxFromProposer: boolean
  proposer?: string
  isExpired?: boolean
}

const CopyTxHashButton = ({ txHash }: { txHash?: string | null }) => {
  const [copied, handleCopy] = useCopyToClipboard(txHash)

  if (!txHash) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="text-inherit" disabled>
              <HashIcon className="size-5" />
            </Button>
          }
        />
        <TooltipContent side="top">Available after execution</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-testid="copy-tx-hash-btn"
            variant="ghost"
            size="icon-sm"
            className="text-inherit"
            onClick={handleCopy}
          >
            <HashIcon className="size-5" />
          </Button>
        }
      />
      <TooltipContent side="top">{copied ? 'Copied' : 'Copy transaction hash'}</TooltipContent>
    </Tooltip>
  )
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
  <>
    <CopyTxHashButton txHash={txHash} />
    <TxShareLinkWrapper id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button data-testid="share-tx-link-btn" variant="ghost" size="icon-sm" className="text-inherit">
              <Copy className="size-5" />
            </Button>
          }
        />
        <TooltipContent side="top">Copy transaction link</TooltipContent>
      </Tooltip>
    </TxShareLinkWrapper>
    {explorerLink ? (
      <ExplorerButton {...explorerLink} isCompact />
    ) : (
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button variant="ghost" size="icon-sm" disabled>
                <ExplorerFallbackIcon className="size-5" />
              </Button>
            </span>
          }
        />
        <TooltipContent side="top">Available after execution</TooltipContent>
      </Tooltip>
    )}
  </>
)

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

  const isMultisig = isMultisigDetailedExecutionInfo(detailedExecutionInfo)
  const isModule = isModuleDetailedExecutionInfo(detailedExecutionInfo)

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
      <div data-testid="transaction-actions-list">
        <AuditLogHeader
          actions={<TxAuditLogActions txId={txId} txHash={txDetails.txHash} explorerLink={explorerLink} />}
        />
        <AuditRow
          label="Executed"
          actionType="executed"
          address={onChainFrom}
          name={resolveName(onChainFrom)}
          timestamp={txDetails.executedAt}
          isLast
        />
      </div>
    )
  }

  // Module-executed transaction: Created (initiator EOA) + Executed (module)
  if (isModule && detailedExecutionInfo) {
    const moduleAddress = detailedExecutionInfo.address.value
    // "AllowanceModule" → "Allowance Module"
    const moduleName = detailedExecutionInfo.address.name?.replace(/([a-z])([A-Z])/g, '$1 $2')

    return (
      <div data-testid="transaction-actions-list">
        <AuditLogHeader
          actions={<TxAuditLogActions txId={txId} txHash={txDetails.txHash} explorerLink={explorerLink} />}
        />

        <AuditRow
          label="Created"
          actionType="created"
          address={onChainFrom}
          name={resolveName(onChainFrom)}
          timestamp={txDetails.executedAt}
        />

        <AuditRow
          label="Executed"
          actionType="executed"
          address={moduleAddress}
          name={resolveName(moduleAddress, moduleName)}
          timestamp={txDetails.executedAt}
          isLast
        />
      </div>
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

  const creationLabel = isTxFromProposer ? 'Proposed' : 'Created'
  const signingLabel = (idx: number) => `Signed (${idx + 1}/${confirmationsRequired})`

  const executionStatus = executor
    ? 'Executed'
    : isPending
      ? txStatus
      : shortenAuditStatus(isTxFromProposer && !isConfirmed ? 'Awaiting review' : txStatus)

  const showExecutionRow = isConfirmed || !!executor || txDetails.txStatus !== 'AWAITING_CONFIRMATIONS'

  return (
    <div data-testid="transaction-actions-list">
      <AuditLogHeader
        chip={
          <TxConfirmations
            submittedConfirmations={confirmations.length}
            requiredConfirmations={confirmationsRequired}
          />
        }
        actions={<TxAuditLogActions txId={txId} txHash={txDetails.txHash} explorerLink={explorerLink} />}
      />

      <AuditRow
        label={creationLabel}
        actionType="created"
        address={proposer}
        name={resolveName(proposer, multisigInfo.proposer?.name || multisigInfo.proposedByDelegate?.name)}
        timestamp={submittedAt}
        isLast={confirmations.length === 0 && !showExecutionRow}
      />

      {confirmations.map(({ signer, submittedAt: signedAt }, idx) => (
        <AuditRow
          key={signer.value}
          label={signingLabel(idx)}
          actionType="signed"
          address={signer.value}
          name={resolveName(signer.value, signer.name)}
          timestamp={signedAt}
          isLast={idx === confirmations.length - 1 && !showExecutionRow}
        />
      ))}

      {showExecutionRow && (
        <AuditRow
          label={executionStatus}
          actionType="executed"
          address={executor?.value}
          name={resolveName(executor?.value, executor?.name)}
          timestamp={txDetails.executedAt}
          isLast
        />
      )}

      {confirmationsNeeded > 0 && !executor && !isExpired && (
        <Alert className="mt-4 py-1">
          {isCancellation
            ? 'Cancellation can be executed once the required approvals are collected.'
            : 'Can be executed once the threshold is reached.'}
        </Alert>
      )}

      {isTxFromProposer && !executor && !isExpired && (
        <Alert className="mt-4 py-1">
          {isCancellation
            ? 'This on-chain rejection was initiated by a proposer. Please review and approve or dismiss it.'
            : 'This transaction was created by a proposer. Please review and either confirm or reject it.'}
        </Alert>
      )}

      {isExpired && (
        <Alert variant="warning" className="mt-4 py-1">
          This order has expired. Reject this transaction and try again.
        </Alert>
      )}
    </div>
  )
}

export default TxSigners
