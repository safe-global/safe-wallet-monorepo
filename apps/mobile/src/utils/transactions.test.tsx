import { getTransactionType } from './transactions'
import { ETxType } from '../types/txType'
import { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('getTransactionType', () => {
  it('should return STAKE_DEPOSIT for NativeStakingDeposit transactions', () => {
    const stakingDepositTxInfo: NativeStakingDepositTransactionInfo = {
      type: 'NativeStakingDeposit',
      humanDescription: 'Deposit ETH for staking',
      status: 'ACTIVE',
      estimatedEntryTime: 86400000,
      estimatedExitTime: 30 * 86400000,
      estimatedWithdrawalTime: 32 * 86400000,
      fee: 0.05,
      monthlyNrr: 4.2,
      annualNrr: 50.4,
      value: '32000000000000000000',
      numValidators: 1,
      expectedAnnualReward: '1612800000000000000',
      expectedMonthlyReward: '134400000000000000',
      expectedFiatAnnualReward: 4838.4,
      expectedFiatMonthlyReward: 403.2,
      tokenInfo: {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        decimals: 18,
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
        name: 'Ethereum',
        symbol: 'ETH',
        trusted: true,
      },
      validators: ['0x123...abc'],
    }

    const result = getTransactionType({ txInfo: stakingDepositTxInfo })
    expect(result).toBe(ETxType.STAKE_DEPOSIT)
  })

  it('should return STAKE_WITHDRAW_REQUEST for NativeStakingValidatorsExit transactions', () => {
    const stakingWithdrawRequestTxInfo: NativeStakingValidatorsExitTransactionInfo = {
      type: 'NativeStakingValidatorsExit',
      humanDescription: 'Exit validators and request withdrawal',
      status: 'ACTIVE',
      value: '32000000000000000000', // 32 ETH
      numValidators: 1,
      estimatedExitTime: 30 * 86400000, // 30 days
      estimatedWithdrawalTime: 2 * 86400000, // 2 days
      tokenInfo: {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        decimals: 18,
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
        name: 'Ethereum',
        symbol: 'ETH',
        trusted: true,
      },
      validators: ['0x123...abc'],
    }

    const result = getTransactionType({ txInfo: stakingWithdrawRequestTxInfo })
    expect(result).toBe(ETxType.STAKE_WITHDRAW_REQUEST)
  })
  it('should return null for unknown transaction types', () => {
    const unknownTxInfo = {
      type: 'UnknownType',
    }

    // @ts-expect-error - Testing with invalid transaction type for completeness
    const result = getTransactionType({ txInfo: unknownTxInfo })
    expect(result).toBe(null)
  })
})
