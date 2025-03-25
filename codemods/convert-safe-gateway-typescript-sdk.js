
/**
 * jscodeshift transformer to update @safe-global/safe-gateway-typescript-sdk imports to @safe-global/store imports.
 * 
 * The scripts modifies import declarations, type references and type assertions across the codebase.
 * 
 * To use the script run
 * 
 * jscodeshift -t codemods/convert-safe-gateway-typescript-sdk.js apps/web/src --extensions=tsx --parser=tsx
 * and
 * jscodeshift -t codemods/convert-safe-gateway-typescript-sdk.js apps/web/src --extensions=ts --parser=ts
 * 
 * This way the changes are applied to both TypeScript and JSX files.
 */

const importMapping = {
  // safe info
  SafeInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/safes', newName: 'SafeState' },
  SafeOverview: { module: '@safe-global/store/gateway/AUTO_GENERATED/safes', newName: 'SafeOverview' },
  ImplementationVersionState: { module: '@safe-global/store/gateway/types', newName: 'ImplementationVersionState' },
  // safe apps
  SafeAppAccessPolicyTypes: { module: '@safe-global/store/gateway/types', newName: 'SafeAppAccessPolicyTypes' },
  SafeAppNoRestrictionsPolicy: { module: '@safe-global/store/gateway/types', newName: 'SafeAppNoRestrictionsPolicy' },
  SafeAppDomainAllowlistPolicy: { module: '@safe-global/store/gateway/types', newName: 'SafeAppDomainAllowlistPolicy' },
  SafeAppsAccessControlPolicies: { module: '@safe-global/store/gateway/types', newName: 'SafeAppsAccessControlPolicies' },
  SafeAppProvider: { module: '@safe-global/store/gateway/AUTO_GENERATED/safe-apps', newName: 'SafeAppProvider' },
  SafeAppFeatures: { module: '@safe-global/store/gateway/types', newName: 'SafeAppFeatures' },
  SafeAppSocialProfile: { module: '@safe-global/store/gateway/AUTO_GENERATED/safe-apps', newName: 'SafeAppSocialProfile' },
  SafeAppSocialPlatforms: { module: '@safe-global/store/gateway/types', newName: 'SafeAppSocialPlatforms' },
  SafeAppData: { module: '@safe-global/store/gateway/AUTO_GENERATED/safe-apps', newName: 'SafeApp' },
  SafeAppsResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/safe-apps', newName: 'SafeAppsGetSafeAppsV1ApiResponse' },

  // common
  SafeBalanceResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/balances', newName: 'BalancesGetBalancesV1ApiResponse' },
  TokenType: { module: '@safe-global/store/gateway/types', newName: 'TokenType' },
  AddressEx: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'AddressInfo' },
  // transactions
  Operation: { module: '@safe-global/store/gateway/types', newName: 'Operation' },
  // don't know what is this?
  // InternalTransaction: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'InternalTransaction' },
  Parameter: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'DataDecodedParameter' },
  DataDecoded: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'DataDecoded' },

  TransactionStatus: { module: '@safe-global/store/gateway/types', newName: 'TransactionStatus' },
  TransferDirection: { module: '@safe-global/store/gateway/types', newName: 'TransferDirection' },
  TransactionTokenType: { module: '@safe-global/store/gateway/types', newName: 'TransactionTokenType' },
  SettingsInfoType: { module: '@safe-global/store/gateway/types', newName: 'SettingsInfoType' },
  TransactionInfoType: { module: '@safe-global/store/gateway/types', newName: 'TransactionInfoType' },
  ConflictType: { module: '@safe-global/store/gateway/types', newName: 'ConflictType' },
  TransactionListItemType: { module: '@safe-global/store/gateway/types', newName: 'TransactionListItemType' },
  DetailedExecutionInfoType: { module: '@safe-global/store/gateway/types', newName: 'DetailedExecutionInfoType' },

  Erc20Transfer: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'Erc20Transfer' },
  Erc721Transfer: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'Erc721Transfer' },
  NativeCoinTransfer: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'NativeCoinTransfer' },
  TransferInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransferInfo' },
  Transfer: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransferTransactionInfo' },
  SetFallbackHandler: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'SetFallbackHandler' },
  TransferInfo: { module: '@safe-global/store/gateway/types', newName: 'TransferInfo' },
  SettingsChange: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'SettingsChangeTransaction' },
  Custom: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'CustomTransactionInfo' },
  MultiSend: { module: '@safe-global/store/gateway/types', newName: 'MultiSend' },
  Cancellation: { module: '@safe-global/store/gateway/types', newName: 'Cancellation' },
  Creation: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'CreationTransactionInfo' },
  Order: { module: '@safe-global/store/gateway/types', newName: 'OrderTransactionInfo' },
  StakingTxInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'StakingTxInfo' },
  OrderToken: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TokenInfo' },
  SwapOrder: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'SwapOrderTransactionInfo' },
  SwapTransferOrder: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'SwapTransferTransactionInfo' },
  TwapOrder: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TwapOrderTransactionInfo' },
  StakingTxDepositInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'NativeStakingDepositTransactionInfo' },
  StakingTxExitInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'NativeStakingValidatorsExitTransactionInfo' },
  StakingTxWithdrawInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'NativeStakingWithdrawTransactionInfo' },

  StakingTxInfo: { module: '@safe-global/store/gateway/types', newName: 'StakingTxInfo' },
  TransactionInfo: { module: '@safe-global/store/gateway/types', newName: 'TransactionInfo' },
  ModuleExecutionInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ModuleExecutionInfo' },
  MultisigExecutionInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'MultisigExecutionInfo' },
  ExecutionInfo: { module: '@safe-global/store/gateway/types', newName: 'ExecutionInfo' },
  TransactionSummary: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'Transaction' },
  Transaction: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionItem' },
  IncomingTransfer: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'IncomingTransfer' },
  ModuleTransaction: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ModuleTransaction' },
  MultisigTransaction: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'MultisigTransaction' },

  DateLabel: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'DateLabel' },
  LabelValue: { module: '@safe-global/store/gateway/types', newName: 'LabelValue' },
  // not sure
  // Label: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'Label' },
  ConflictHeader: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ConflictHeaderQueuedItem' },
  // not sure
  // TransactionListItem: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionListItem' },
  TransactionListPage: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionItemPage' },
  MultisigTransactionRequest: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ProposeTransactionDto' },
  SafeAppInfo: { module: '@safe-global/store/gateway/AUTO_GENERATED/safe-apps', newName: 'SafeAppInfo' },
  TransactionData: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionData' },
  ModuleExecutionDetails: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ModuleExecutionDetails' },
  MultisigConfirmation: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'MultisigConfirmationDetails' },
  MultisigExecutionDetails: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'MultisigExecutionDetails' },
  DetailedExecutionInfo: { module: '@safe-global/store/gateway/types', newName: 'DetailedExecutionInfo' },
  TransactionDetails: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionDetails' },
  TransactionPreview: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TransactionPreview' },
  // not sure
  // SafeTransactionEstimationRequest
  // SafeTransactionEstimation
  // NoncesResponse
  SafeIncomingTransfersResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'IncomingTransferPage' },
  SafeModuleTransactionsResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'ModuleTransactionPage' },
  SafeMultisigTransactionsResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/transactions', newName: 'TxsMultisigTransactionPage' },

  // Chains 
  RPC_AUTHENTICATION: { module: '@safe-global/store/gateway/types', newName: 'RPC_AUTHENTICATION' },
  RpcUri: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'RpcUri' },
  BlockExplorerUriTemplate: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'BlockExplorerUriTemplate' },
  NativeCurrency: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'NativeCurrency' },
  Theme: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'Theme' },
  GAS_PRICE_TYPE: { module: '@safe-global/store/gateway/types', newName: 'GAS_PRICE_TYPE' },
  GasPriceOracle: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'GasPriceOracle' },
  GasPriceFixed: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'GasPriceFixed' },
  GasPriceFixedEip1559: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'GasPriceFixedEip1559' },
  GasPriceUnknown: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'GasPriceUnknown' },
  GasPrice: { module: '@safe-global/store/gateway/types', newName: 'GasPrice' },
  FEATURES: { module: '@safe-global/store/gateway/types', newName: 'FEATURES' },
  ChainInfo: { module: '@safe-global/store/gateway/types', newName: 'ChainInfo' },
  ChainListResponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'ChainPage' },
  ChainIndexingStatus: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'IndexingStatus' },
  MasterCopyReponse: { module: '@safe-global/store/gateway/AUTO_GENERATED/chains', newName: 'ChainsGetMasterCopiesV1ApiResponse' },

  // Data Decoded


  // Messages
  SafeMessageListItemType: { module: '@safe-global/store/gateway/types', newName: 'SafeMessageListItemType' },
  SafeMessageDateLabel: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'DateLabel' },
  SafeMessageStatus: { module: '@safe-global/store/gateway/types', newName: 'SafeMessageStatus' },
  TypedDataDomain: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'TypedDataDomain' },
  TypedDataTypes: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'TypedDataParameter' },
  TypedMessageTypes: { module: '@safe-global/store/gateway/types', newName: 'TypedMessageTypes' },
  EIP712TypedData: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'TypedData' },
  SafeMessage: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'MessageItem' },
  SafeMessageListItem: { module: '@safe-global/store/gateway/types', newName: 'SafeMessageListItem' },
  SafeMessageListPage: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'MessagePage' },
  ProposeSafeMessageRequest: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'CreateMessageDto' },
  ConfirmSafeMessageRequest: { module: '@safe-global/store/gateway/AUTO_GENERATED/messages', newName: 'UpdateMessageSignatureDto' },

  // Notifications
  DeviceType: { module: '@safe-global/store/gateway/types', newName: 'DeviceType' },
  SafeRegistration: { module: '@safe-global/store/gateway/AUTO_GENERATED/notifications', newName: 'SafeRegistration' },
  RegisterDeviceDto: { module: '@safe-global/store/gateway/AUTO_GENERATED/notifications', newName: 'RegisterDeviceDto' },


  // RelayTransactionRequest
  RelayTransactionRequest: { module: '@safe-global/store/gateway/types', newName: 'RelayDto' },
  RelayTransactionResponse: { module: '@safe-global/store/gateway/types', newName: 'RelayRelayV1ApiResponse' },
  RelayCountResponse: { module: '@safe-global/store/gateway/types', newName: 'RelaysRemaining' },

};

export default function transformer(file, api) {
  if (!file.source.includes('@safe-global/safe-gateway-typescript-sdk')) {
    return file.source;
  }

  const j = api.jscodeshift;
  const root = j(file.source);

  const newImportsMap = new Map();
  const importsToRemove = [];

  root.find(j.ImportDeclaration, { source: { value: '@safe-global/safe-gateway-typescript-sdk' } })
    .forEach(path => {
      const baseImportKind = path.node.importKind || 'value';
      const transformedSpecifiers = [];

      path.node.specifiers.forEach(specifier => {
        if (specifier.type !== 'ImportSpecifier') return;

        const importedName = specifier.imported.name;
        const mapping = importMapping[importedName];
        if (!mapping) return;

        const specifierImportKind = specifier.importKind || baseImportKind;
        const key = `${mapping.module}|${specifierImportKind}`;
        if (!newImportsMap.has(key)) newImportsMap.set(key, []);

        const localName = specifier.local.name !== importedName ? specifier.local.name : undefined;
        if (localName) {
          newImportsMap.get(key).push(
            j.importSpecifier(j.identifier(mapping.newName), j.identifier(localName))
          );
        } else {
          newImportsMap.get(key).push(j.importSpecifier(j.identifier(mapping.newName)));
        }

        transformedSpecifiers.push(specifier);
      });

      if (transformedSpecifiers.length === path.node.specifiers.length) {
        importsToRemove.push(path);
      } else {
        path.node.specifiers = path.node.specifiers.filter(spec => !transformedSpecifiers.includes(spec));
      }
    });

  importsToRemove.forEach(p => j(p).remove());

  newImportsMap.forEach((specifiers, key) => {
    const [module, importKind] = key.split('|');
    const importDecl = j.importDeclaration(specifiers, j.literal(module));
    if (importKind === 'type') importDecl.importKind = 'type';
    root.get().node.program.body.unshift(importDecl);
  });

  // Replace types in angle-bracket assertions according to importMapping
  root.find(j.TSTypeAssertion).forEach(path => {
    const typeName = path.node.typeAnnotation.typeName?.name
    if (typeName && importMapping[typeName]) {
      path.node.typeAnnotation.typeName.name = importMapping[typeName].newName
    }
  })

  // Replace type references according to importMapping
  root.find(j.TSTypeReference).forEach(path => {
    const typeName = path.node.typeName?.name
    if (typeName && importMapping[typeName]) {
      path.node.typeName.name = importMapping[typeName].newName
    }
  })

  return root.toSource({ quote: 'single', trailingComma: true });
}