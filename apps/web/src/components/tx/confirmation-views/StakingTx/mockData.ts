import { faker } from '@faker-js/faker'
import type {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  NativeStakingWithdrawTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

// Seed faker for deterministic values in stories
faker.seed(456)

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
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  validators: [
    '0x' + faker.string.hexadecimal({ length: 96, casing: 'lower', prefix: '' }),
    '0x' + faker.string.hexadecimal({ length: 96, casing: 'lower', prefix: '' }),
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
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0x' + faker.string.hexadecimal({ length: 96, casing: 'lower', prefix: '' })],
}

export const mockStakingWithdrawTxInfo: NativeStakingWithdrawTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_WITHDRAW,
  humanDescription: null,
  value: '32000000000000000000',
  tokenInfo: {
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0x' + faker.string.hexadecimal({ length: 96, casing: 'lower', prefix: '' })],
}
