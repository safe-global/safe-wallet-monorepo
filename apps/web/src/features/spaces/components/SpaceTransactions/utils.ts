import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  AddressInfo,
  SettingsChangeTransaction,
  Transaction,
  VaultInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { groupConflictingTxs } from '@/utils/tx-list'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  isAnyStakingTxInfo,
  isAwaitingExecution,
  isBridgeOrderTxInfo,
  isCancellationTxInfo,
  isCustomTxInfo,
  isIncomingTransfer,
  isLifiSwapTxInfo,
  isMigrateToL2TxInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isNestedConfirmationTxInfo,
  isOrderTxInfo,
  isSettingsChangeTxInfo,
  isTransferTxInfo,
  isLabelListItem,
  isMultisigExecutionInfo,
  isSignableBy,
  isTransactionQueuedItem,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
} from '@/utils/transaction-guards'
import type { SpaceQueueItems } from '../../store/spaceQueueApi'

export const getSafeKey = (safeAddress: string): string => safeAddress.toLowerCase()

export const getNonce = (tx: Transaction): number | undefined =>
  isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined

export type QueueStatus = 'execute' | 'sign' | 'waiting' | 'blocked'

export const getQueueStatus = (tx: Transaction, isNext: boolean, walletAddress?: string): QueueStatus => {
  if (isAwaitingExecution(tx.txStatus)) return isNext ? 'execute' : 'blocked'
  return walletAddress && isSignableBy(tx, walletAddress) ? 'sign' : 'waiting'
}

export type QueueRowData =
  | { kind: 'conflict'; nonce: number | undefined; size: number }
  | { kind: 'transaction'; item: TransactionQueuedItem; isNext: boolean; conflict?: ConflictOption }

/** A transaction's place among those sharing its nonce, `option` counting from 1. */
export type ConflictOption = { option: number; size: number }

/** The table rows of one Safe on one chain: its transactions, with a header row before each group sharing a nonce. */
export const getSectionRows = (items: SpaceQueueItems): QueueRowData[] => {
  let label: string | undefined
  return groupConflictingTxs(items).flatMap<QueueRowData>((entry) => {
    if (Array.isArray(entry)) {
      const transactions = entry.filter(isTransactionQueuedItem)
      if (transactions.length === 0) return []
      return [
        { kind: 'conflict', nonce: getNonce(transactions[0].transaction), size: transactions.length },
        ...transactions.map((item, index) => ({
          kind: 'transaction' as const,
          item,
          isNext: label === 'Next',
          conflict: { option: index + 1, size: transactions.length },
        })),
      ]
    }
    if (isLabelListItem(entry)) {
      label = entry.label
      return []
    }
    if (isTransactionQueuedItem(entry)) {
      return [{ kind: 'transaction', item: entry, isNext: label === 'Next' }]
    }
    return []
  })
}

export type CounterpartyJoin = 'to' | 'from' | 'via' | 'on'

/** The other party after a transaction's summary: an address, or a protocol the list response names without one. */
export type Counterparty = { join: CounterpartyJoin; party: AddressInfo } | { join: CounterpartyJoin; protocol: string }

// The gateway only gives these types to calls to the LI.FI Diamond, CoW Protocol or Kiln, so the type names the contract
const LIFI = 'LI.FI'
const COW_PROTOCOL = 'CoW Protocol'
const KILN = 'Kiln'

const vaultParty = ({ address, name, logoUri }: VaultInfo): AddressInfo => ({ value: address, name, logoUri })

export const getCounterparty = (txInfo: TransactionInfo): Counterparty | undefined => {
  if (isTransferTxInfo(txInfo)) {
    return isIncomingTransfer(txInfo) ? { join: 'from', party: txInfo.sender } : { join: 'to', party: txInfo.recipient }
  }
  // A rejection is an empty call to the Safe itself
  if (isCancellationTxInfo(txInfo)) return undefined
  if (isMultiSendTxInfo(txInfo)) return { join: 'via', party: txInfo.to }
  if (isCustomTxInfo(txInfo)) {
    // A migration is a delegate call that changes the Safe itself. Read `to` first: the migration guard claims every
    // custom call, so txInfo is narrowed to never once it returns false
    const { to } = txInfo
    return isMigrateToL2TxInfo(txInfo) ? undefined : { join: 'on', party: to }
  }
  if (isBridgeOrderTxInfo(txInfo)) return { join: 'via', protocol: LIFI }
  if (isLifiSwapTxInfo(txInfo)) return { join: 'on', protocol: LIFI }
  if (isOrderTxInfo(txInfo)) return { join: 'on', protocol: COW_PROTOCOL }
  if (isAnyStakingTxInfo(txInfo)) return { join: 'via', protocol: KILN }
  if (isVaultDepositTxInfo(txInfo)) return { join: 'to', party: vaultParty(txInfo.vaultInfo) }
  if (isVaultRedeemTxInfo(txInfo)) return { join: 'from', party: vaultParty(txInfo.vaultInfo) }
  return undefined
}

/** Type tags the queue names differently from the shared transaction type, or undefined to keep that one. */
export type QueueTypeLabel = 'Settings' | 'Contract' | 'Nested'

export const getQueueTypeLabel = (tx: Transaction): QueueTypeLabel | undefined => {
  const { txInfo } = tx
  if (isSettingsChangeTxInfo(txInfo) || isMigrateToL2TxInfo(txInfo)) return 'Settings'
  if (!isCustomTxInfo(txInfo) || tx.safeAppInfo || isMultiSendTxInfo(txInfo) || isCancellationTxInfo(txInfo)) {
    return undefined
  }
  if (isModuleExecutionInfo(tx.executionInfo)) return undefined
  return isNestedConfirmationTxInfo(txInfo) ? 'Nested' : 'Contract'
}

const addressLabel = (address: AddressInfo): string => address.name || shortenAddress(address.value)

/** What a settings change does, in words: "Add signer Alice", "Change threshold to 3". */
export const getSettingsSummary = (txInfo: SettingsChangeTransaction): string => {
  const { settingsInfo } = txInfo
  switch (settingsInfo?.type) {
    case 'ADD_OWNER':
      return `Add signer ${addressLabel(settingsInfo.owner)}`
    case 'REMOVE_OWNER':
      return `Remove signer ${addressLabel(settingsInfo.owner)}`
    case 'SWAP_OWNER':
      return `Replace signer ${addressLabel(settingsInfo.oldOwner)} with ${addressLabel(settingsInfo.newOwner)}`
    case 'CHANGE_THRESHOLD':
      return `Change threshold to ${settingsInfo.threshold}`
    case 'ENABLE_MODULE':
      return `Enable module ${addressLabel(settingsInfo.module)}`
    case 'DISABLE_MODULE':
      return `Disable module ${addressLabel(settingsInfo.module)}`
    case 'SET_GUARD':
      return `Set guard ${addressLabel(settingsInfo.guard)}`
    case 'DELETE_GUARD':
      return 'Remove guard'
    case 'SET_MODULE_GUARD':
      return `Set module guard ${addressLabel(settingsInfo.moduleGuard)}`
    case 'DELETE_MODULE_GUARD':
      return 'Remove module guard'
    case 'SET_FALLBACK_HANDLER':
      return `Set fallback handler ${addressLabel(settingsInfo.handler)}`
    case 'CHANGE_MASTER_COPY':
      return `Update Safe to ${addressLabel(settingsInfo.implementation)}`
    default:
      return txInfo.humanDescription || txInfo.dataDecoded.method
  }
}

/** The nonce the Safe executes next, or undefined when no loaded row sits under the "Next" label. */
export const getNextNonce = (rows: QueueRowData[]): number | undefined => {
  const next = rows.find((row) => row.kind === 'transaction' && row.isNext)
  return next?.kind === 'transaction' ? getNonce(next.item.transaction) : undefined
}
