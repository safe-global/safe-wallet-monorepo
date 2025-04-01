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
    ProposeSafeMessageRequest: {
      module: '@safe-global/store/gateway/AUTO_GENERATED/messages',
      newName: 'CreateMessageDto',
    },
    ConfirmSafeMessageRequest: {
      module: '@safe-global/store/gateway/AUTO_GENERATED/messages',
      newName: 'UpdateMessageSignatureDto',
    },
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
    sourcePackage
})
  