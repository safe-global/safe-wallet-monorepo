import type {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  NativeStakingWithdrawTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

// Fixed timestamp for deterministic tests: Dec 24, 2024
const FIXED_TIMESTAMP = 1735000000

export const mockStakingDepositTxInfo: NativeStakingDepositTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_DEPOSIT,
  humanDescription: null,
  status: 'NOT_STAKED',
  estimatedEntryTime: FIXED_TIMESTAMP + 86400,
  estimatedExitTime: FIXED_TIMESTAMP + 604800,
  estimatedWithdrawalTime: FIXED_TIMESTAMP + 691200,
  fee: 100000000000000,
  monthlyNrr: 40,
  annualNrr: 480,
  numValidators: 2,
  value: '64000000000000000000',
  expectedAnnualReward: '3200000000000000000',
  expectedMonthlyReward: '266666666666666666',
  expectedFiatAnnualReward: 6400,
  expectedFiatMonthlyReward: 533.33,
  tokenInfo: {
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  validators: [
    '0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    '0x0f1e2d3c4b5a0f1e2d3c4b5a0f1e2d3c4b5a0f1e2d3c4b5a0f1e2d3c4b5a0f1e2d3c4b5a0f1e2d3c4b5a0f1e2d3c4b5a',
  ],
}

export const mockStakingExitTxInfo: NativeStakingValidatorsExitTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT,
  humanDescription: null,
  status: 'ACTIVE',
  estimatedExitTime: FIXED_TIMESTAMP + 604800,
  estimatedWithdrawalTime: FIXED_TIMESTAMP + 691200,
  numValidators: 1,
  value: '32000000000000000000',
  tokenInfo: {
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0x9a8b7c6d5e4f9a8b7c6d5e4f9a8b7c6d5e4f9a8b7c6d5e4f9a8b7c6d5e4f9a8b7c6d5e4f9a8b7c6d5e4f9a8b7c6d5e4f'],
}

export const mockStakingWithdrawTxInfo: NativeStakingWithdrawTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_WITHDRAW,
  humanDescription: null,
  value: '32000000000000000000',
  tokenInfo: {
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0x3c5e7a9b1d2f3c5e7a9b1d2f3c5e7a9b1d2f3c5e7a9b1d2f3c5e7a9b1d2f3c5e7a9b1d2f3c5e7a9b1d2f3c5e7a9b1d2f'],
}
