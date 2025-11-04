/**
 * jscodeshift transformer to update @safe-global/safe-gateway-typescript-sdk Messages imports to @safe-global/store messages imports.
 *
 * The scripts modifies import declarations, type references and type assertions across the codebase.
 *
 * To use the script run
 *
 * jscodeshift -t codemods/safe-gateway-typescript-sdk/convert-messages.js apps/web/src --extensions=tsx --parser=tsx
 * and
 * jscodeshift -t codemods/safe-gateway-typescript-sdk/convert-messages.js apps/web/src --extensions=ts --parser=ts
 *
 * This way the changes are applied to both TypeScript and JSX files.
 */

import createTransformer from './transform'
export const importMapping = {
  // Transactions
  TransactionData: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionData' },
  TransactionPreview: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'TransactionPreview',
  },
  InternalTransaction: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'MultiSend' },
  TransactionListPage: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'TransactionItemPage',
  },
  DetailedExecutionInfoType: { module: '@safe-global/store/gateway/types', newName: 'DetailedExecutionInfoType' },
  MultisigExecutionInfo: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'MultisigExecutionInfo',
  },
  Transaction: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ModuleTransaction' },
  TransactionSummary: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'Transaction' },
  TransactionDetails: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'TransactionDetails',
  },
  ConflictType: { module: '@safe-global/store/gateway/types', newName: 'ConflictType' },
  LabelValue: { module: '@safe-global/store/gateway/types', newName: 'LabelValue' },
  TransactionInfo: { module: '@safe-global/store/gateway/types', newName: 'TransactionInfo' },
  TransactionInfoType: { module: '@safe-global/store/gateway/types', newName: 'TransactionInfoType' },
  TransactionListItem: { module: '@safe-global/store/gateway/types', newName: 'TransactionListItem' },
  TransactionListItemType: { module: '@safe-global/store/gateway/types', newName: 'TransactionListItemType' },
  TransactionStatus: { module: '@safe-global/store/gateway/types', newName: 'TransactionStatus' },
  ImplementationVersionState: { module: '@safe-global/store/gateway/types', newName: 'ImplementationVersionState' },
  AllOwnedSafes: { module: '@safe-global/store/gateway/types', newName: 'AllOwnedSafes' },
  DeviceType: { module: '@safe-global/store/gateway/types', newName: 'DeviceType' },
  RegisterNotificationsRequest: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/notifications',
    newName: 'RegisterDeviceDto',
  },
  Order: { module: '@safe-global/store/gateway/types', newName: 'OrderTransactionInfo' },
  DateLabel: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'DateLabel' },
  SettingsInfoType: { module: '@safe-global/store/gateway/types', newName: 'SettingsInfoType' },
  TransactionTokenType: { module: '@safe-global/store/gateway/types', newName: 'TransactionTokenType' },
  TransferDirection: { module: '@safe-global/store/gateway/types', newName: 'TransferDirection' },
  AddressEx: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'AddressInfo' },
  DataDecoded: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'DataDecoded' },
  MultisigExecutionDetails: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'MultisigExecutionDetails',
  },
  SettingsChange: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'SettingsChangeTransaction',
  },
  Custom: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'CustomTransactionInfo' },
  Transfer: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransferTransactionInfo' },
  TokenType: { module: '@safe-global/store/gateway/types', newName: 'TokenType' },
  DecodedDataResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/data-decoded', newName: 'DataDecoded' },
  StakingTxInfo: { module: '@safe-global/store/gateway/types', newName: 'StakingTxInfo' },
  RelayCountResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/relay', newName: 'RelaysRemaining' },
  SafeAppAccessPolicyTypes: { module: '@safe-global/store/gateway/types', newName: 'SafeAppAccessPolicyTypes' },
  SafeBalanceResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/balances', newName: 'Balances' },
  StakingTxDepositInfo: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'NativeStakingDepositTransactionInfo',
  },
  StakingTxExitInfo: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'NativeStakingValidatorsExitTransactionInfo',
  },
  StakingTxWithdrawInfo: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'NativeStakingWithdrawTransactionInfo',
  },
  NativeStakingStatus: {
    module: '@safe-global/store/gateway/types',
    newName: 'NativeStakingStatus',
  },
  OrderStatuses: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'OrderStatuses' },
  OrderKind: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'OrderKind' },
  SwapOrder: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'SwapOrderTransactionInfo' },
  TwapOrder: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TwapOrderTransactionInfo' },
  SwapTransferOrder: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'SwapTransactionInfo',
  },
  StartTimeValue: { module: '@safe-global/store/gateway/types', newName: 'StartTimeValue' },
  OrderToken: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TokenInfo' },
  DurationType: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'DurationType' },
  ChainInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'Chain' },
  MasterCopyReponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'MasterCopy' },
  OwnedSafes: { module: '@safe-global/store/gateway/types', newName: 'OwnedSafes' },
  Label: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'LabelQueuedItem' },
  TransferInfo: { module: '@safe-global/store/gateway/types', newName: 'TransferInfo' },
  Creation: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'CreationTransaction' },
  MultiSend: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'MultiSendTransactionInfo' },
  DetailedExecutionInfo: { module: '@safe-global/store/gateway/types', newName: 'DetailedExecutionInfo' },
  ChangeThreshold: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ChangeThreshold' },
  ConflictHeader: {
    module: '@safe-global/store/gateway/AUTO_GENERATED/transactions',
    newName: 'ConflictHeaderQueuedItem',
  },
  ExecutionInfo: { module: '@safe-global/store/gateway/types', newName: 'ExecutionInfo' },
}

export const enumLiteralMappings = {
  SafeMessageStatus: {
    NEEDS_CONFIRMATION: 'NEEDS_CONFIRMATION',
    CONFIRMED: 'CONFIRMED',
  },

  SafeMessageListItemType: {
    DATE_LABEL: 'DATE_LABEL',
    MESSAGE: 'MESSAGE',
  },
}

export const sourcePackage = '@safe-global/safe-gateway-typescript-sdk'

export default createTransformer({
  importMapping,
  enumLiteralMappings,
  sourcePackage,
})
