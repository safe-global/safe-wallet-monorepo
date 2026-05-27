import { EligibleEarnTokens } from '../constants'

export const vaultTypeToLabel = {
  VaultDeposit: 'Deposit',
  VaultRedeem: 'Withdraw',
}

export const isEligibleEarnToken = (chainId: string, tokenAddress: string) => {
  return EligibleEarnTokens[chainId]?.includes(tokenAddress)
}

export const isEarnSupportedOnChain = (chainId: string) => {
  return Boolean(EligibleEarnTokens[chainId]?.length)
}
