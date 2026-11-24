import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  AddressInfo,
  SettingsChangeTransaction,
  TokenInfo,
  Transaction,
  VaultInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { groupConflictingTxs } from '@/utils/tx-list'
import { ellipsis, formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import {
  isAnyStakingTxInfo,
  isAwaitingExecution,
  isBridgeOrderTxInfo,
  isCancellationTxInfo,
  isCustomTxInfo,
  isERC20Transfer,
  isERC721Transfer,
  isIncomingTransfer,
  isLifiSwapTxInfo,
  isMigrateToL2TxInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isNativeTokenTransfer,
  isNestedConfirmationTxInfo,
  isOrderTxInfo,
  isSettingsChangeTxInfo,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
  isTransferTxInfo,
  isLabelListItem,
  isMultisigExecutionInfo,
  isTransactionQueuedItem,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
} from '@/utils/transaction-guards'
import type { ConflictOption, QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import type { SpaceQueueItems } from '../../hooks/useSpaceQueue'

export const getSafeKey = (safeAddress: string): string => safeAddress.toLowerCase()

export const getNonce = (tx: Transaction): number | undefined =>
  isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined

/** Lowercased addresses of the caller's wallets, the ones that make a transaction theirs to sign */
export type SignerWallets = ReadonlySet<string>

/** `sign` when one of the caller's wallets is still a missing signer of the transaction */
export const getQueueStatus = (tx: Transaction, isNext: boolean, signers: SignerWallets): QueueStatus => {
  if (isAwaitingExecution(tx.txStatus)) return isNext ? 'execute' : 'blocked'
  const missingSigners = isMultisigExecutionInfo(tx.executionInfo) ? (tx.executionInfo.missingSigners ?? []) : []
  return missingSigners.some(({ value }) => signers.has(value.toLowerCase())) ? 'sign' : 'waiting'
}

export type QueueRowData =
  | { kind: 'conflict'; nonce: number | undefined; size: number }
  | { kind: 'transaction'; item: TransactionQueuedItem; isNext: boolean; conflict?: ConflictOption }

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
    // Read `to` before the migration guard, which narrows txInfo to never when it returns false
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

/** The nonces already held by an on-chain rejection, which a second one would duplicate. */
export const getRejectedNonces = (rows: QueueRowData[]): Set<number> =>
  new Set(
    rows.flatMap((row) => {
      if (row.kind !== 'transaction') return []
      const { txInfo } = row.item.transaction
      const nonce = getNonce(row.item.transaction)
      return isCustomTxInfo(txInfo) && txInfo.isCancellation && nonce !== undefined ? [nonce] : []
    }),
  )

/** The nonce the Safe executes next, or undefined when no loaded row sits under the "Next" label. */
export const getNextNonce = (rows: QueueRowData[]): number | undefined => {
  const next = rows.find((row) => row.kind === 'transaction' && row.isNext)
  return next?.kind === 'transaction' ? getNonce(next.item.transaction) : undefined
}

/**
 * Where the Safe's next nonce stands for the user: `execute` when an option there can execute, else `sign` when they
 * can sign one, else `waiting`. Undefined when no loaded row is next. `statuses` lines up with `rows`.
 */
export const getNextStatus = (
  rows: QueueRowData[],
  statuses: Array<QueueStatus | undefined>,
): QueueStatus | undefined => {
  const next = statuses.filter((_, index) => {
    const row = rows[index]
    return row.kind === 'transaction' && row.isNext
  })
  if (next.length === 0) return undefined
  if (next.includes('execute')) return 'execute'
  return next.includes('sign') ? 'sign' : 'waiting'
}

/** The Blocked by button's tooltip: what the user has to do about the nonce holding the row back */
export const getBlockedByHint = (nonce: number, nextStatus?: QueueStatus): string => {
  if (nextStatus === 'execute') return `#${nonce} is fully signed. Execute it first.`
  if (nextStatus === 'sign') return `#${nonce} needs your signature first.`
  return `#${nonce} is waiting on other signers.`
}

/**
 * The nonce a row waits on when the user can't act on it: fully signed, or still signing without them, behind the
 * Safe's next nonce. Undefined when the user can sign or execute it, or the next nonce isn't loaded.
 */
export const getBlockedBy = (status: QueueStatus, nonce?: number, nextNonce?: number): number | undefined => {
  if (nextNonce === undefined) return undefined
  if (status === 'blocked') return nextNonce
  return status === 'waiting' && nonce !== undefined && nonce > nextNonce ? nextNonce : undefined
}

/** The nonce tooltip: the row's state and what happens next, given where the Safe's next nonce stands */
export const getNonceHint = (
  status: QueueStatus,
  nonce?: number,
  nextNonce?: number,
): { state: string; hint: string } => {
  const isNext = nonce !== undefined && nonce === nextNonce
  const isBehind = nonce !== undefined && nextNonce !== undefined && nonce > nextNonce
  const blocked = {
    state: 'Blocked',
    hint:
      nextNonce === undefined
        ? "Blocked. It can't run until the earlier nonces execute."
        : `Blocked. It can't run until #${nextNonce} executes.`,
  }
  switch (status) {
    case 'execute':
      return { state: 'Ready to execute', hint: 'Next in line. It can run now.' }
    case 'sign':
      return {
        state: 'Ready to sign',
        hint: isNext
          ? 'Next in line. Needs your signature.'
          : isBehind
            ? `You can sign now. It runs after #${nonce - 1}.`
            : 'Needs your signature.',
      }
    case 'waiting':
      if (isBehind) return blocked
      return {
        state: 'Signing',
        hint: isNext ? 'Next in line. Waiting on other signers.' : 'Waiting on other signers.',
      }
    case 'blocked':
      return blocked
  }
}

/** What each transaction type means, in the type tag's tooltip */
export const TYPE_HINTS = {
  Send: 'Transfers tokens out of this Safe.',
  Swap: 'Trades one token for another through a swap protocol.',
  Bridge: 'Moves tokens from this network to another one.',
  Batch: 'Runs several actions together in one transaction.',
  Contract: 'Calls a function on a smart contract.',
  Settings: 'Changes this Safe’s settings, such as its signers or threshold.',
  Nested: 'Approves a transaction on another Safe that this Safe co-owns.',
  Rejection: 'Cancels the proposal at this nonce by replacing it.',
  Stake: 'Stakes ETH with Kiln, in 32 ETH validators.',
  WithdrawRequest: 'Asks Kiln to exit validators, so their ETH can be claimed.',
  Claim: 'Claims ETH from validators that have exited.',
} as const

/** The type tag's tooltip text, or undefined for a type the design doesn't explain (incoming transfers, vaults) */
export const getTypeHint = (tx: Transaction): string | undefined => {
  const { txInfo } = tx
  if (isCustomTxInfo(txInfo) && tx.safeAppInfo) {
    return `Created in the ${tx.safeAppInfo.name} Safe App. ${TYPE_HINTS.Contract}`
  }
  const label = getQueueTypeLabel(tx)
  if (label) return TYPE_HINTS[label]
  if (isTransferTxInfo(txInfo)) return isIncomingTransfer(txInfo) ? undefined : TYPE_HINTS.Send
  if (isOrderTxInfo(txInfo) || isLifiSwapTxInfo(txInfo)) return TYPE_HINTS.Swap
  if (isBridgeOrderTxInfo(txInfo)) return TYPE_HINTS.Bridge
  if (isMultiSendTxInfo(txInfo)) return TYPE_HINTS.Batch
  if (isCancellationTxInfo(txInfo)) return TYPE_HINTS.Rejection
  if (isStakingTxDepositInfo(txInfo)) return TYPE_HINTS.Stake
  if (isStakingTxExitInfo(txInfo)) return TYPE_HINTS.WithdrawRequest
  if (isStakingTxWithdrawInfo(txInfo)) return TYPE_HINTS.Claim
  // A module's call: the queue's own Contract label leaves it to the shared type, which names the contract
  if (isCustomTxInfo(txInfo)) return TYPE_HINTS.Contract
  return undefined
}

/** Settings changes that can move funds or block transactions without the usual signatures */
export const POLICY_CHANGES = ['ENABLE_MODULE', 'SET_GUARD', 'SET_FALLBACK_HANDLER', 'CHANGE_MASTER_COPY']

export const WARNING_LABELS = {
  imitation: 'This may be a malicious transaction',
  untrustedToken: 'Unverified token',
  unknownNetwork: 'Unknown network',
  expired: 'Order expired',
  policyChange: 'Changes who controls funds',
  toSelf: 'Sends to this Safe',
} as const

/** The warnings a row lists behind its warning icon, in order */
export const getQueueWarnings = (args: {
  tx: Transaction
  safeAddress: string
  /** The chain checks tokens against the default token list */
  checksTokens: boolean
  expired: boolean
  /** A bridge to a chain the app doesn't know */
  unknownNetwork: boolean
}): string[] => {
  const { tx, safeAddress } = args
  const { txInfo } = tx
  const isSettingsPolicyChange =
    isSettingsChangeTxInfo(txInfo) && POLICY_CHANGES.includes(txInfo.settingsInfo?.type ?? '')
  const isToSelf =
    isTransferTxInfo(txInfo) && !isIncomingTransfer(txInfo) && sameAddress(txInfo.recipient.value, safeAddress)
  return [
    isImitation(tx) && WARNING_LABELS.imitation,
    args.checksTokens && !isTrustedTx(tx) && WARNING_LABELS.untrustedToken,
    args.unknownNetwork && WARNING_LABELS.unknownNetwork,
    args.expired && WARNING_LABELS.expired,
    isSettingsPolicyChange && WARNING_LABELS.policyChange,
    isToSelf && WARNING_LABELS.toSelf,
  ].filter((warning): warning is (typeof WARNING_LABELS)[keyof typeof WARNING_LABELS] => !!warning)
}

const getMissingSigners = (tx: Transaction): string[] =>
  isMultisigExecutionInfo(tx.executionInfo)
    ? (tx.executionInfo.missingSigners ?? []).map(({ value }) => value.toLowerCase())
    : []

/**
 * Ids of the conflicting options the user can still sign although they signed another option at the same nonce: a
 * wallet of theirs missing here isn't missing there. An option no longer awaiting signatures can't tell, so it is skipped.
 */
export const getSignedOtherOptions = (rows: QueueRowData[], signers: SignerWallets): Set<string> => {
  const byNonce = new Map<number | undefined, Transaction[]>()
  for (const row of rows) {
    if (row.kind !== 'transaction' || !row.conflict) continue
    const tx = row.item.transaction
    byNonce.set(getNonce(tx), [...(byNonce.get(getNonce(tx)) ?? []), tx])
  }
  const ids = new Set<string>()
  for (const options of byNonce.values()) {
    for (const tx of options) {
      const mine = getMissingSigners(tx).filter((address) => signers.has(address))
      const signedOther = options.some((other) => {
        const missing = getMissingSigners(other)
        return other !== tx && missing.length > 0 && mine.some((address) => !missing.includes(address))
      })
      if (signedOther) ids.add(tx.id)
    }
  }
  return ids
}

/** The Sign button's tooltip on a queue row, or undefined when it needs none */
export const getSignHint = (args: {
  tx: Transaction
  status: QueueStatus
  nextNonce?: number
  signedOther?: boolean
}): string | undefined => {
  const { tx, status } = args
  if (status !== 'sign') return undefined
  const nonce = getNonce(tx)
  if (args.signedOther) return `You signed another option at #${nonce}. Only one can execute.`
  const isLast =
    isMultisigExecutionInfo(tx.executionInfo) &&
    tx.executionInfo.confirmationsRequired - tx.executionInfo.confirmationsSubmitted === 1
  return isLast && nonce === args.nextNonce ? 'Yours is the last signature. You can execute right after.' : undefined
}

export type SafeBandChainFacts = {
  chainName: string
  nextNonce?: number
  /** Unknown until the Safe's overview loads */
  threshold?: number
  owners?: number
}

/** The facts the band's Safe card lists: networks, threshold, next nonce and the user's signing wallets */
export const getSafeBandDetails = (
  chains: SafeBandChainFacts[],
  signerNames: string[],
): Array<{ label: string; value: string; mono?: boolean }> => {
  const perChain = (format: (chain: SafeBandChainFacts) => string | undefined) => {
    const known = chains.flatMap((chain) => {
      const value = format(chain)
      return value === undefined ? [] : [{ chain, value }]
    })
    if (known.length === 0) return undefined
    const values = new Set(known.map(({ value }) => value))
    return chains.length === 1 || (values.size === 1 && known.length === chains.length)
      ? known[0].value
      : known.map(({ chain, value }) => `${value} on ${chain.chainName}`).join(', ')
  }
  const threshold = perChain(({ threshold, owners }) =>
    threshold !== undefined && owners !== undefined ? `${threshold} of ${owners} signers` : undefined,
  )
  const nextNonce = perChain(({ nextNonce }) => (nextNonce === undefined ? undefined : `#${nextNonce}`))
  return [
    { label: chains.length === 1 ? 'Network' : 'Networks', value: chains.map(({ chainName }) => chainName).join(', ') },
    ...(threshold ? [{ label: 'Threshold', value: threshold }] : []),
    ...(nextNonce ? [{ label: 'Next nonce', value: nextNonce, mono: true }] : []),
    ...(signerNames.length > 0 ? [{ label: 'You sign with', value: signerNames.join(', ') }] : []),
  ]
}

/** An amount as the queue row shows it, with the parts TokenAmount needs */
export type QueueAmount = {
  value: string
  decimals?: number | null
  symbol?: string | null
  logoUri?: string | null
  /** The row's symbol when it is cut short, e.g. a long NFT name */
  rowSymbol?: string
  fallbackSrc?: string
}

export const toQueueAmount = (
  value: string,
  token: Pick<TokenInfo, 'decimals' | 'symbol' | 'logoUri'>,
): QueueAmount => ({
  value,
  decimals: token.decimals,
  symbol: token.symbol,
  logoUri: token.logoUri,
})

/** The amount in plain text, formatted as TokenAmount formats it on the row: "1.5 ETH" */
export const formatQueueAmount = ({ value, decimals, symbol }: QueueAmount): string =>
  `${decimals !== undefined ? formatVisualAmount(value, decimals) : value}${symbol ? ` ${symbol}` : ''}`

/** The amount a transfer, a Kiln stake or claim, or a vault deposit or withdrawal moves; undefined for other types */
export const getQueueAmount = (
  txInfo: TransactionInfo,
  nativeCurrency?: Pick<TokenInfo, 'decimals' | 'symbol' | 'logoUri'>,
): QueueAmount | undefined => {
  if (isTransferTxInfo(txInfo)) {
    const transfer = txInfo.transferInfo
    if (isNativeTokenTransfer(transfer)) {
      return {
        value: transfer.value ?? '0',
        decimals: nativeCurrency?.decimals,
        symbol: nativeCurrency?.symbol,
        logoUri: nativeCurrency?.logoUri,
      }
    }
    if (isERC20Transfer(transfer)) {
      return {
        value: transfer.value,
        decimals: transfer.decimals,
        symbol: transfer.tokenSymbol,
        logoUri: transfer.logoUri,
      }
    }
    if (isERC721Transfer(transfer)) {
      const symbol = `${transfer.tokenSymbol || 'Unknown NFT'} #${transfer.tokenId}`
      return {
        value: '1',
        decimals: 0,
        symbol,
        rowSymbol: ellipsis(symbol, 16),
        logoUri: transfer.logoUri,
        fallbackSrc: '/images/common/nft-placeholder.png',
      }
    }
    return undefined
  }
  if (isStakingTxDepositInfo(txInfo) || isStakingTxWithdrawInfo(txInfo))
    return toQueueAmount(txInfo.value, txInfo.tokenInfo)
  if (isVaultDepositTxInfo(txInfo) || isVaultRedeemTxInfo(txInfo)) return toQueueAmount(txInfo.value, txInfo.tokenInfo)
  return undefined
}
