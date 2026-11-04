export enum TokenTransferType {
  multiSig = 'multiSig',
  spendingLimit = 'spendingLimit',
}

export enum TokenAmountFields {
  tokenAddress = 'tokenAddress',
  amount = 'amount',
}

enum Fields {
  recipient = 'recipient',
}

export const TokenTransferFields = { ...Fields, ...TokenAmountFields }

export type TokenTransferParams = {
  [TokenTransferFields.recipient]: string
  [TokenTransferFields.tokenAddress]: string
  [TokenTransferFields.amount]: string
}

export enum MultiTransfersFields {
  recipients = 'recipients',
  type = 'type',
}

export const MultiTokenTransferFields = { ...MultiTransfersFields }

export type MultiTokenTransferParams = {
  [MultiTransfersFields.recipients]: TokenTransferParams[]
  [MultiTransfersFields.type]: TokenTransferType
}
