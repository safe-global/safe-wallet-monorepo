export interface RecipientParams {
  recipientAddress: string
  recipientName?: string
}

export interface TokenParams extends RecipientParams {
  tokenAddress: string
}

export interface AmountParams {
  recipientAddress: string
  tokenAddress: string
  amount: string
}

export interface SendTransactionParams {
  recipient: string
  tokenAddress: string
  amount: string
  decimals: number
  chainId: string
  safeAddress: string
  sender: string
}
