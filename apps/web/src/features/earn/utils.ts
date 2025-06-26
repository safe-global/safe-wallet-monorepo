import { EligibleEarnTokens } from '@/features/earn/constants'

export const vaultTypeToLabel = {
  VaultDeposit: 'Deposit',
  VaultRedeem: 'Withdraw',
}

export const isEligibleEarnToken = (chainId: string, tokenAddress: string) => {
  return EligibleEarnTokens[chainId]?.includes(tokenAddress)
}
