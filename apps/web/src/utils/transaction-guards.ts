import type {
  StakingTxInfo,
  DetailedExecutionInfo,
  TransactionInfo,
  OrderTransactionInfo,
  ExecutionInfo,
  TransactionListItem,
  TransferInfo,
  Cancellation,
} from '@safe-global/store/gateway/types'
import {
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransferDirection,
  TransactionListItemType,
  ConflictType,
  TransactionTokenType,
} from '@safe-global/store/gateway/types'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import type {
  ConflictHeaderQueuedItem,
  CustomTransactionInfo,
  DateLabel,
  LabelQueuedItem,
  MultiSendTransactionInfo,
  MultisigExecutionDetails,
  MultisigExecutionInfo,
  SettingsChangeTransaction,
  SwapOrderTransactionInfo,
  Transaction,
  TransferTransactionInfo,
  TwapOrderTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  NativeStakingDepositTransactionInfo,
  NativeStakingWithdrawTransactionInfo,
  TransactionData,
  TransactionItem,
  TransactionQueuedItem,
  QueuedItemPage,
  CreationTransactionInfo,
  Erc20Transfer,
  Erc721Transfer,
  ModuleExecutionDetails,
  ModuleExecutionInfo,
  NativeCoinTransfer,
  TransactionItemPage,
  SwapTransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export type AnyResults = (TransactionItemPage['results'] | QueuedItemPage['results'])[number]

import { type AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Operation } from '@safe-global/store/gateway/types'
// NOTE: Import directly from deployments file (not barrel) to avoid circular dependency
// transaction-guards.ts is imported by store slices, and the barrel imports createFeatureHandle
// which has dependencies that create a circular import chain
import { getDeployedSpendingLimitModuleAddress } from '@/features/spending-limits/services/spendingLimitDeployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { NamedAddress } from '@/components/new-safe/create/types'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import { id } from 'ethers'
import {
  getSafeToL2MigrationDeployment,
  getSafeMigrationDeployment,
  getMultiSendDeployments,
  getSignMessageLibDeployments,
} from '@safe-global/safe-deployments'
import {
  Safe__factory,
  Safe_to_l2_migration__factory,
  Sign_message_lib__factory,
} from '@safe-global/utils/types/contracts'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import { isMultiSendCalldata } from './transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { OperationType } from '@safe-global/types-kit'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import type {
  BridgeAndSwapTransactionInfo,
  SwapTransactionInfo,
  TransactionDetails,
  VaultDepositTransactionInfo,
  VaultRedeemTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const isTxQueued = (value: Transaction['txStatus']): boolean => {
  return ['AWAITING_CONFIRMATIONS', 'AWAITING_EXECUTION'].includes(value)
}

export const isAwaitingExecution = (txStatus: Transaction['txStatus']): boolean => 'AWAITING_EXECUTION' === txStatus

const isAddressEx = (owners: AddressInfo[] | NamedAddress[]): owners is AddressInfo[] => {
  return (owners as AddressInfo[]).every((owner) => owner.value !== undefined)
}

export const isOwner = (safeOwners: AddressInfo[] | NamedAddress[] = [], walletAddress?: string) => {
  if (isAddressEx(safeOwners)) {
    return safeOwners.some((owner) => sameAddress(owner.value, walletAddress))
  }

  return safeOwners.some((owner) => sameAddress(owner.address, walletAddress))
}

export const isMultisigDetailedExecutionInfo = (
  value?: DetailedExecutionInfo | null,
): value is MultisigExecutionDetails => {
  return value?.type === DetailedExecutionInfoType.MULTISIG
}

export const isModuleDetailedExecutionInfo = (
  value?: DetailedExecutionInfo | null,
): value is ModuleExecutionDetails => {
  return value?.type === DetailedExecutionInfoType.MODULE
}

const isMigrateToL2CallData = (value: {
  to: string
  data: string | undefined
  operation?: OperationType | undefined
}) => {
  const safeToL2MigrationDeployment = getSafeToL2MigrationDeployment()
  const safeToL2MigrationAddress = safeToL2MigrationDeployment?.defaultAddress
  const safeToL2MigrationInterface = Safe_to_l2_migration__factory.createInterface()

  if (value.operation === OperationType.DelegateCall && sameAddress(value.to, safeToL2MigrationAddress)) {
    const migrateToL2Selector = safeToL2MigrationInterface?.getFunction('migrateToL2')?.selector
    return migrateToL2Selector && value.data ? value.data.startsWith(migrateToL2Selector) : false
  }
  return false
}

export const isMigrateToL2TxData = (
  value: TransactionData | null | undefined,
  chainId: string | undefined,
): boolean => {
  if (!value) {
    return false
  }

  if (
    chainId &&
    value?.hexData &&
    isMultiSendCalldata(value?.hexData) &&
    hasMatchingDeployment(getMultiSendDeployments, value.to.value, chainId, ['1.3.0', '1.4.1'])
  ) {
    // Its a multiSend to the MultiSend contract (not CallOnly)
    const decodedMultiSend = decodeMultiSendData(value.hexData)
    const firstTx = decodedMultiSend[0]

    // We only trust the tx if the first tx is the only delegateCall
    const hasMoreDelegateCalls = decodedMultiSend
      .slice(1)
      .some((value) => value.operation === OperationType.DelegateCall)

    if (!hasMoreDelegateCalls && firstTx && isMigrateToL2CallData(firstTx)) {
      return true
    }
  }

  if (!value.hexData) {
    return false
  }

  return isMigrateToL2CallData({ to: value.to.value, data: value.hexData, operation: value.operation as 0 | 1 })
}

// TransactionInfo type guards
export const isTransferTxInfo = (value: TransactionInfo): value is TransferTransactionInfo => {
  return value.type === TransactionInfoType.TRANSFER || isSwapTransferOrderTxInfo(value)
}

/**
 * A fulfillment transaction for swap, limit or twap order is always a SwapOrder
 * It cannot be a TWAP order
 *
 * @param value
 */
export const isSwapTransferOrderTxInfo = (value: TransactionInfo): value is SwapTransferTransactionInfo => {
  return value.type === TransactionInfoType.SWAP_TRANSFER
}

export const isSettingsChangeTxInfo = (value: TransactionInfo): value is SettingsChangeTransaction => {
  return value.type === TransactionInfoType.SETTINGS_CHANGE
}

export const isCustomTxInfo = (value: TransactionInfo): value is CustomTransactionInfo => {
  return value.type === TransactionInfoType.CUSTOM
}

export const isMultiSendTxInfo = (value: TransactionInfo): value is MultiSendTransactionInfo => {
  return value.type === TransactionInfoType.CUSTOM && value.methodName === 'multiSend'
}

export const isOrderTxInfo = (value: TransactionInfo): value is OrderTransactionInfo => {
  return isSwapOrderTxInfo(value) || isTwapOrderTxInfo(value)
}

export const isMigrateToL2TxInfo = (value: TransactionInfo): value is CustomTransactionInfo => {
  const safeToL2MigrationDeployment = getSafeToL2MigrationDeployment()
  const safeToL2MigrationAddress = safeToL2MigrationDeployment?.defaultAddress

  return isCustomTxInfo(value) && sameAddress(value.to.value, safeToL2MigrationAddress)
}

export const isSwapOrderTxInfo = (value: TransactionInfo): value is SwapOrderTransactionInfo => {
  return value.type === TransactionInfoType.SWAP_ORDER
}

export const isBridgeOrderTxInfo = (value: any): value is BridgeAndSwapTransactionInfo => {
  return (value.type as string) === 'SwapAndBridge'
}

export const isLifiSwapTxInfo = (value: any): value is SwapTransactionInfo => {
  return (value.type as string) === 'Swap'
}

export const isTwapOrderTxInfo = (value: TransactionInfo): value is TwapOrderTransactionInfo => {
  return value.type === TransactionInfoType.TWAP_ORDER
}

export const isStakingTxDepositInfo = (value: TransactionInfo): value is NativeStakingDepositTransactionInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_DEPOSIT
}

export const isStakingTxExitInfo = (value: TransactionInfo): value is NativeStakingValidatorsExitTransactionInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT
}

export const isStakingTxWithdrawInfo = (value: TransactionInfo): value is NativeStakingWithdrawTransactionInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_WITHDRAW
}

export const isAnyStakingTxInfo = (value: TransactionInfo): value is StakingTxInfo => {
  return isStakingTxDepositInfo(value) || isStakingTxExitInfo(value) || isStakingTxWithdrawInfo(value)
}

export const isCancelledSwapOrder = (value: TransactionInfo) => {
  return isSwapOrderTxInfo(value) && value.status === 'cancelled'
}

export const isOpenSwapOrder = (value: TransactionInfo) => {
  return isSwapOrderTxInfo(value) && value.status === 'open'
}

export const isCancellationTxInfo = (value: TransactionInfo): value is Cancellation => {
  return isCustomTxInfo(value) && value.isCancellation
}

export const isCreationTxInfo = (value: TransactionInfo): value is CreationTransactionInfo => {
  return value.type === TransactionInfoType.CREATION
}

export const isOutgoingTransfer = (txInfo: TransactionInfo): boolean => {
  return isTransferTxInfo(txInfo) && txInfo.direction.toUpperCase() === TransferDirection.OUTGOING
}

export const isIncomingTransfer = (txInfo: TransactionInfo): boolean => {
  return isTransferTxInfo(txInfo) && txInfo.direction.toUpperCase() === TransferDirection.INCOMING
}

// TransactionListItem type guards
export const isLabelListItem = (
  value: QueuedItemPage['results'][number] | TransactionItemPage['results'][number],
): value is LabelQueuedItem => {
  return value.type === TransactionListItemType.LABEL
}

export const isConflictHeaderQueuedItem = (value: AnyResults): value is ConflictHeaderQueuedItem => {
  return value.type === TransactionListItemType.CONFLICT_HEADER
}

export const isDateLabel = (value: AnyResults): value is DateLabel => {
  return value.type === TransactionListItemType.DATE_LABEL
}

export const isTransactionListItem = (value: AnyResults): value is TransactionItem => {
  return value.type === TransactionListItemType.TRANSACTION && value.conflictType === ConflictType.NONE
}

export const isTransactionQueuedItem = (value: AnyResults): value is TransactionQueuedItem => {
  return value.type === TransactionListItemType.TRANSACTION
}

export function isRecoveryQueueItem(value: TransactionListItem | RecoveryQueueItem): value is RecoveryQueueItem {
  const EVENT_SIGNATURE = 'TransactionAdded(uint256,bytes32,address,uint256,bytes,uint8)'
  return 'fragment' in value && id(EVENT_SIGNATURE) === value.fragment.topicHash
}

// Narrows `Transaction`
// TODO: Consolidate these types with the new sdk
export const isMultisigExecutionInfo = (
  value?: ExecutionInfo | DetailedExecutionInfo | null,
): value is MultisigExecutionInfo => {
  return value?.type === 'MULTISIG'
}

export const isModuleExecutionInfo = (
  value?: ExecutionInfo | DetailedExecutionInfo | null,
): value is ModuleExecutionInfo => value?.type === 'MODULE'

export const isSignableBy = (txSummary: Transaction, walletAddress: string): boolean => {
  const executionInfo = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo : undefined
  return !!executionInfo?.missingSigners?.some((address) => address.value === walletAddress)
}

export const isConfirmableBy = (txSummary: Transaction, walletAddress: string): boolean => {
  if (!txSummary.executionInfo || !isMultisigExecutionInfo(txSummary.executionInfo)) {
    return false
  }
  const { confirmationsRequired, confirmationsSubmitted } = txSummary.executionInfo
  return (
    confirmationsSubmitted >= confirmationsRequired ||
    (confirmationsSubmitted === confirmationsRequired - 1 && isSignableBy(txSummary, walletAddress))
  )
}

export const isExecutable = (
  txSummary: Transaction,
  walletAddress: string,
  safe: Pick<SafeState, 'nonce'>,
): boolean => {
  if (
    !txSummary.executionInfo ||
    !isMultisigExecutionInfo(txSummary.executionInfo) ||
    safe.nonce !== txSummary.executionInfo.nonce
  ) {
    return false
  }
  return isConfirmableBy(txSummary, walletAddress)
}

// Spending limits
enum SPENDING_LIMIT_METHODS_NAMES {
  ADD_DELEGATE = 'addDelegate',
  SET_ALLOWANCE = 'setAllowance',
  EXECUTE_ALLOWANCE_TRANSFER = 'executeAllowanceTransfer',
  DELETE_ALLOWANCE = 'deleteAllowance',
}

export type SpendingLimitMethods = 'setAllowance' | 'deleteAllowance'

export const isSetAllowance = (method?: string): method is SpendingLimitMethods => {
  return method === SPENDING_LIMIT_METHODS_NAMES.SET_ALLOWANCE
}

export const isDeleteAllowance = (method?: string): method is SpendingLimitMethods => {
  return method === SPENDING_LIMIT_METHODS_NAMES.DELETE_ALLOWANCE
}

export const isSpendingLimitMethod = (method?: string): boolean => {
  return isSetAllowance(method) || isDeleteAllowance(method)
}

export const isSupportedSpendingLimitAddress = (txInfo: TransactionInfo, chainId: string): boolean => {
  const toAddress = isCustomTxInfo(txInfo) ? txInfo.to.value : ''
  const spendingLimitModuleAddress = getDeployedSpendingLimitModuleAddress(chainId, [{ value: toAddress }])
  return !!spendingLimitModuleAddress
}

// Method parameter types
export const isArrayParameter = (parameter: string): boolean => /(\[\d*?])+$/.test(parameter)
export const isAddress = (type: string): boolean => type.indexOf('address') === 0
export const isByte = (type: string): boolean => type.indexOf('byte') === 0

export const isNoneConflictType = (transaction: QueuedItemPage['results'][number]) => {
  return transaction.type === 'TRANSACTION' && transaction.conflictType === ConflictType.NONE
}

export const isNativeTokenTransfer = (value: TransferInfo): value is NativeCoinTransfer => {
  return value.type === TransactionTokenType.NATIVE_COIN
}

export const isERC20Transfer = (value: TransferInfo): value is Erc20Transfer => {
  return value.type === TransactionTokenType.ERC20
}

export const isERC721Transfer = (value: TransferInfo): value is Erc721Transfer => {
  return value.type === TransactionTokenType.ERC721
}

const safeInterface = Safe__factory.createInterface()
const signMessageInterface = Sign_message_lib__factory.createInterface()
/**
 * True if the tx calls `approveHash`
 */
export const isOnChainConfirmationTxData = (data?: TransactionData | null): boolean => {
  const approveHashSelector = safeInterface.getFunction('approveHash').selector
  return Boolean(data && data.hexData?.startsWith(approveHashSelector))
}

export const isOnChainConfirmationTxInfo = (info: TransactionInfo): info is CustomTransactionInfo => {
  if (isCustomTxInfo(info)) {
    return info.methodName === 'approveHash' && info.dataSize === '36'
  }
  return false
}

export const isOnChainSignMessageTxData = (data: TransactionData | null | undefined, chainId: string): boolean => {
  const signMessageSelector = signMessageInterface.getFunction('signMessage').selector
  const toAddress = data?.to.value
  const isDelegateCall = data?.operation === Operation.DELEGATE
  const isSignMessageLib =
    toAddress !== undefined &&
    hasMatchingDeployment(getSignMessageLibDeployments, toAddress, chainId, ['1.3.0', '1.4.1'])
  return Boolean(data && data.hexData?.startsWith(signMessageSelector) && isSignMessageLib && isDelegateCall)
}

/**
 * True if the tx calls `execTransaction`
 */
export const isExecTxData = (data?: TransactionData | null): boolean => {
  const execTransactionSelector = safeInterface.getFunction('execTransaction').selector
  return Boolean(data && data.hexData?.startsWith(execTransactionSelector))
}

export const isExecTxInfo = (info: TransactionInfo): info is CustomTransactionInfo => {
  if (isCustomTxInfo(info)) {
    return info.methodName === 'execTransaction'
  }
  return false
}

export const isNestedConfirmationTxInfo = (info: TransactionInfo): boolean => {
  return isCustomTxInfo(info) && (isOnChainConfirmationTxInfo(info) || isExecTxInfo(info))
}

export const isSafeUpdateTxData = (data?: TransactionData | null): boolean => {
  if (!data || !data.hexData) return false

  // Must be a trusted delegate call
  if (!(data.trustedDelegateCallTarget && data.operation === Operation.DELEGATE)) {
    return false
  }

  // For 1.3.0+ Safes
  const migrationContract = getSafeMigrationDeployment({ version: LATEST_SAFE_VERSION })
  if (migrationContract && sameAddress(data.to.value, migrationContract.defaultAddress)) {
    return true
  }

  // For older Safes
  return (
    isMultiSendCalldata(data.hexData) &&
    Boolean(
      Array.isArray(data.dataDecoded?.parameters?.[0]?.valueDecoded) &&
        data.dataDecoded.parameters[0].valueDecoded.some((tx) => tx.dataDecoded?.method === 'changeMasterCopy'),
    )
  )
}

export const isSafeMigrationTxData = (data?: TransactionData | null): boolean => {
  if (!data || !data.hexData) return false
  return isMigrateToL2CallData({
    data: data.hexData,
    to: data.to.value,
    operation: data.operation as number,
  })
}

export const isVaultDepositTxInfo = (value: TransactionDetails['txInfo']): value is VaultDepositTransactionInfo => {
  return value.type === 'VaultDeposit'
}

export const isVaultRedeemTxInfo = (value: TransactionDetails['txInfo']): value is VaultRedeemTransactionInfo => {
  return value.type === 'VaultRedeem'
}

export const isAnyEarnTxInfo = (
  value: TransactionDetails['txInfo'],
): value is VaultDepositTransactionInfo | VaultRedeemTransactionInfo => {
  return isVaultDepositTxInfo(value) || isVaultRedeemTxInfo(value)
}
