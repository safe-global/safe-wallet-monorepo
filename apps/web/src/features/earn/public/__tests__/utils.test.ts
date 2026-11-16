import { vaultTypeToLabel, isEligibleEarnToken } from '../utils'

describe('vaultTypeToLabel', () => {
  it('maps VaultDeposit to Deposit', () => {
    expect(vaultTypeToLabel.VaultDeposit).toBe('Deposit')
  })

  it('maps VaultRedeem to Withdraw', () => {
    expect(vaultTypeToLabel.VaultRedeem).toBe('Withdraw')
  })
})

describe('isEligibleEarnToken', () => {
  it('returns true for eligible token on chain 1', () => {
    // USDT on mainnet
    expect(isEligibleEarnToken('1', '0xdAC17F958D2ee523a2206206994597C13D831ec7')).toBe(true)
  })

  it('returns true for eligible token on chain 8453', () => {
    // USDC on Base
    expect(isEligibleEarnToken('8453', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')).toBe(true)
  })

  it('returns false for ineligible token address', () => {
    expect(isEligibleEarnToken('1', '0x0000000000000000000000000000000000000000')).toBe(false)
  })

  it('returns undefined for unsupported chain', () => {
    expect(isEligibleEarnToken('137', '0xdAC17F958D2ee523a2206206994597C13D831ec7')).toBeUndefined()
  })
})
