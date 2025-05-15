import type {
  AddressEx,
  BaselineConfirmationView,
  Cancellation,
  ConflictHeader,
  Creation,
  Custom,
  DateLabel,
  DetailedExecutionInfo,
  Erc20Transfer,
  Erc721Transfer,
  ExecutionInfo,
  Label,
  ModuleExecutionDetails,
  ModuleExecutionInfo,
  MultiSend,
  MultisigExecutionDetails,
  MultisigExecutionInfo,
  NativeCoinTransfer,
  NativeStakingDepositConfirmationView,
  Order,
  AnyConfirmationView,
  AnySwapOrderConfirmationView,
  SafeInfo,
  SettingsChange,
  SwapOrder,
  SwapOrderConfirmationView,
  Transaction,
  TransactionInfo,
  TransactionListItem,
  TransactionSummary,
  Transfer,
  TransferInfo,
  TwapOrder,
  TwapOrderConfirmationView,
  AnyStakingConfirmationView,
  StakingTxExitInfo,
  StakingTxDepositInfo,
  StakingTxWithdrawInfo,
  NativeStakingWithdrawConfirmationView,
  NativeStakingValidatorsExitConfirmationView,
  StakingTxInfo,
  TransactionData,
} from '@safe-global/safe-gateway-typescript-sdk'
import {
  ConfirmationViewTypes,
  ConflictType,
  DetailedExecutionInfoType,
  Operation,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/safe-gateway-typescript-sdk'
import { getDeployedSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { NamedAddress } from '@/components/new-safe/create/types'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import { ethers } from 'ethers'
import {
  getSafeToL2MigrationDeployment,
  getSafeMigrationDeployment,
  getMultiSendDeployments,
} from '@safe-global/safe-deployments'
import { Safe__factory, Safe_to_l2_migration__factory } from '@/types/contracts'
import { hasMatchingDeployment } from '@/services/contracts/deployments'
import { isMultiSendCalldata } from './transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { LATEST_SAFE_VERSION } from '@/config/constants'
import type {
  TransactionDetails,
  VaultDepositTransactionInfo,
  VaultRedeemTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const isTxQueued = (value: TransactionStatus): boolean => {
  return [TransactionStatus.AWAITING_CONFIRMATIONS, TransactionStatus.AWAITING_EXECUTION].includes(value)
}

export const isAwaitingExecution = (txStatus: TransactionStatus): boolean =>
  TransactionStatus.AWAITING_EXECUTION === txStatus

const isAddressEx = (owners: AddressEx[] | NamedAddress[]): owners is AddressEx[] => {
  return (owners as AddressEx[]).every((owner) => owner.value !== undefined)
}

export const isOwner = (safeOwners: AddressEx[] | NamedAddress[] = [], walletAddress?: string) => {
  if (isAddressEx(safeOwners)) {
    return safeOwners.some((owner) => sameAddress(owner.value, walletAddress))
  }

  return safeOwners.some((owner) => sameAddress(owner.address, walletAddress))
}

export const isMultisigDetailedExecutionInfo = (value?: DetailedExecutionInfo): value is MultisigExecutionDetails => {
  return value?.type === DetailedExecutionInfoType.MULTISIG
}

export const isModuleDetailedExecutionInfo = (value?: DetailedExecutionInfo): value is ModuleExecutionDetails => {
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

export const isMigrateToL2TxData = (value: TransactionData | undefined, chainId: string | undefined): boolean => {
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

  return isMigrateToL2CallData({ to: value.to.value, data: value.hexData, operation: value.operation as 0 | 1 })
}

// TransactionInfo type guards
export const isTransferTxInfo = (value: TransactionInfo): value is Transfer => {
  return value.type === TransactionInfoType.TRANSFER || isSwapTransferOrderTxInfo(value)
}

/**
 * A fulfillment transaction for swap, limit or twap order is always a SwapOrder
 * It cannot be a TWAP order
 *
 * @param value
 */
export const isSwapTransferOrderTxInfo = (value: TransactionInfo): value is SwapOrder => {
  return value.type === TransactionInfoType.SWAP_TRANSFER
}

export const isSettingsChangeTxInfo = (value: TransactionInfo): value is SettingsChange => {
  return value.type === TransactionInfoType.SETTINGS_CHANGE
}

export const isCustomTxInfo = (value: TransactionInfo): value is Custom => {
  return value.type === TransactionInfoType.CUSTOM
}

export const isMultiSendTxInfo = (value: TransactionInfo): value is MultiSend => {
  return (
    value.type === TransactionInfoType.CUSTOM &&
    value.methodName === 'multiSend' &&
    typeof value.actionCount === 'number'
  )
}

export const isOrderTxInfo = (value: TransactionInfo): value is Order => {
  return isSwapOrderTxInfo(value) || isTwapOrderTxInfo(value)
}

export const isMigrateToL2TxInfo = (value: TransactionInfo): value is Custom => {
  const safeToL2MigrationDeployment = getSafeToL2MigrationDeployment()
  const safeToL2MigrationAddress = safeToL2MigrationDeployment?.defaultAddress

  return isCustomTxInfo(value) && sameAddress(value.to.value, safeToL2MigrationAddress)
}

export const isSwapOrderTxInfo = (value: TransactionInfo): value is SwapOrder => {
  return value.type === TransactionInfoType.SWAP_ORDER
}

export const isTwapOrderTxInfo = (value: TransactionInfo): value is TwapOrder => {
  return value.type === TransactionInfoType.TWAP_ORDER
}

export const isStakingTxDepositInfo = (value: TransactionInfo): value is StakingTxDepositInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_DEPOSIT
}

export const isStakingTxExitInfo = (value: TransactionInfo): value is StakingTxExitInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT
}

export const isStakingTxWithdrawInfo = (value: TransactionInfo): value is StakingTxWithdrawInfo => {
  return value.type === TransactionInfoType.NATIVE_STAKING_WITHDRAW
}

export const isAnyStakingTxInfo = (value: TransactionInfo): value is StakingTxInfo => {
  return isStakingTxDepositInfo(value) || isStakingTxExitInfo(value) || isStakingTxWithdrawInfo(value)
}

export const isTwapConfirmationViewOrder = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is TwapOrderConfirmationView => {
  if (decodedData && 'type' in decodedData) {
    return decodedData.type === ConfirmationViewTypes.COW_SWAP_TWAP_ORDER
  }

  return false
}

export const isSwapConfirmationViewOrder = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is SwapOrderConfirmationView => {
  if (decodedData && 'type' in decodedData) {
    return decodedData.type === ConfirmationViewTypes.COW_SWAP_ORDER
  }

  return false
}

export const isAnySwapConfirmationViewOrder = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is AnySwapOrderConfirmationView => {
  return isSwapConfirmationViewOrder(decodedData) || isTwapConfirmationViewOrder(decodedData)
}

export const isStakingDepositConfirmationView = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is NativeStakingDepositConfirmationView => {
  if (decodedData && 'type' in decodedData) {
    return decodedData?.type === ConfirmationViewTypes.KILN_NATIVE_STAKING_DEPOSIT
  }
  return false
}

export const isStakingExitConfirmationView = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is NativeStakingValidatorsExitConfirmationView => {
  if (decodedData && 'type' in decodedData) {
    return decodedData?.type === ConfirmationViewTypes.KILN_NATIVE_STAKING_VALIDATORS_EXIT
  }
  return false
}

export const isStakingWithdrawConfirmationView = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is NativeStakingWithdrawConfirmationView => {
  if (decodedData && 'type' in decodedData) {
    return decodedData?.type === ConfirmationViewTypes.KILN_NATIVE_STAKING_WITHDRAW
  }
  return false
}

export const isAnyStakingConfirmationView = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is AnyStakingConfirmationView => {
  return (
    isStakingDepositConfirmationView(decodedData) ||
    isStakingExitConfirmationView(decodedData) ||
    isStakingWithdrawConfirmationView(decodedData)
  )
}

export const isGenericConfirmation = (
  decodedData: AnyConfirmationView | undefined,
): decodedData is BaselineConfirmationView => {
  if (decodedData && 'type' in decodedData) {
    return decodedData.type === ConfirmationViewTypes.GENERIC
  }
  return false
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

export const isCreationTxInfo = (value: TransactionInfo): value is Creation => {
  return value.type === TransactionInfoType.CREATION
}

export const isOutgoingTransfer = (txInfo: TransactionInfo): boolean => {
  return isTransferTxInfo(txInfo) && txInfo.direction.toUpperCase() === TransferDirection.OUTGOING
}

export const isIncomingTransfer = (txInfo: TransactionInfo): boolean => {
  return isTransferTxInfo(txInfo) && txInfo.direction.toUpperCase() === TransferDirection.INCOMING
}

// TransactionListItem type guards
export const isLabelListItem = (value: TransactionListItem): value is Label => {
  return value.type === TransactionListItemType.LABEL
}

export const isConflictHeaderListItem = (value: TransactionListItem): value is ConflictHeader => {
  return value.type === TransactionListItemType.CONFLICT_HEADER
}

export const isDateLabel = (value: TransactionListItem): value is DateLabel => {
  return value.type === TransactionListItemType.DATE_LABEL
}

export const isTransactionListItem = (value: TransactionListItem): value is Transaction => {
  return value.type === TransactionListItemType.TRANSACTION
}

export function isRecoveryQueueItem(value: TransactionListItem | RecoveryQueueItem): value is RecoveryQueueItem {
  const EVENT_SIGNATURE = 'TransactionAdded(uint256,bytes32,address,uint256,bytes,uint8)'
  return 'fragment' in value && ethers.id(EVENT_SIGNATURE) === value.fragment.topicHash
}

// Narrows `Transaction`
// TODO: Consolidate these types with the new sdk
export const isMultisigExecutionInfo = (
  value?: ExecutionInfo | DetailedExecutionInfo,
): value is MultisigExecutionInfo => {
  return value?.type === 'MULTISIG'
}

export const isModuleExecutionInfo = (value?: ExecutionInfo | DetailedExecutionInfo): value is ModuleExecutionInfo =>
  value?.type === 'MODULE'

export const isSignableBy = (txSummary: TransactionSummary, walletAddress: string): boolean => {
  const executionInfo = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo : undefined
  return !!executionInfo?.missingSigners?.some((address) => address.value === walletAddress)
}

export const isConfirmableBy = (txSummary: TransactionSummary, walletAddress: string): boolean => {
  if (!txSummary.executionInfo || !isMultisigExecutionInfo(txSummary.executionInfo)) {
    return false
  }
  const { confirmationsRequired, confirmationsSubmitted } = txSummary.executionInfo
  return (
    confirmationsSubmitted >= confirmationsRequired ||
    (confirmationsSubmitted === confirmationsRequired - 1 && isSignableBy(txSummary, walletAddress))
  )
}

export const isExecutable = (txSummary: TransactionSummary, walletAddress: string, safe: SafeInfo): boolean => {
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

export const isNoneConflictType = (transaction: Transaction) => {
  return transaction.conflictType === ConflictType.NONE
}
export const isHasNextConflictType = (transaction: Transaction) => {
  return transaction.conflictType === ConflictType.HAS_NEXT
}
export const isEndConflictType = (transaction: Transaction) => {
  return transaction.conflictType === ConflictType.END
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
/**
 * True if the tx calls `approveHash`
 */
export const isOnChainConfirmationTxData = (data?: TransactionData): boolean => {
  const approveHashSelector = safeInterface.getFunction('approveHash').selector
  return Boolean(data && data.hexData?.startsWith(approveHashSelector))
}

export const isOnChainConfirmationTxInfo = (info: TransactionInfo): info is Custom => {
  if (isCustomTxInfo(info)) {
    return info.methodName === 'approveHash' && info.dataSize === '36'
  }
  return false
}

/**
 * True if the tx calls `execTransaction`
 */
export const isExecTxData = (data?: TransactionData): boolean => {
  const execTransactionSelector = safeInterface.getFunction('execTransaction').selector
  return Boolean(data && data.hexData?.startsWith(execTransactionSelector))
}

export const isExecTxInfo = (info: TransactionInfo): info is Custom => {
  if (isCustomTxInfo(info)) {
    return info.methodName === 'execTransaction'
  }
  return false
}

export const isNestedConfirmationTxInfo = (info: TransactionInfo): boolean => {
  return isCustomTxInfo(info) && (isOnChainConfirmationTxInfo(info) || isExecTxInfo(info))
}

export const isSafeUpdateTxData = (data?: TransactionData): boolean => {
  if (!data) return false

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
    isMultiSendCalldata(data.hexData || '') &&
    Boolean(
      data.dataDecoded?.parameters?.[0]?.valueDecoded?.some((tx) => tx.dataDecoded?.method === 'changeMasterCopy'),
    )
  )
}

export const isSafeMigrationTxData = (data?: TransactionData): boolean => {
  if (!data) return false
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
