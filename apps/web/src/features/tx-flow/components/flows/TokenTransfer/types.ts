export enum TokenTransferType {
  multiSig = 'multiSig',
  spendingLimit = 'spendingLimit',
}

// Field names for token transfer forms
// Note: tokenAddress and amount match TokenAmountFields from @/components/common/TokenAmountInput
export const TokenTransferFields = {
  recipient: 'recipient',
  tokenAddress: 'tokenAddress',
  amount: 'amount',
} as const

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
