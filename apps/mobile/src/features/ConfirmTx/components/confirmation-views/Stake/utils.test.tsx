import React from 'react'
import { render } from '@/src/tests/test-utils'
import { formatStakingDepositItems, formatStakingValidatorItems, formatStakingWithdrawRequestItems } from './utils'
import {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockDepositTxInfo: NativeStakingDepositTransactionInfo = {
  type: 'NativeStakingDeposit',
  humanDescription: 'Deposit tokens for staking',
  status: 'ACTIVE',
  estimatedEntryTime: 86400000, // 1 day in milliseconds
  estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
  estimatedWithdrawalTime: 32 * 86400000, // 32 days in milliseconds
  fee: 0.05, // 5% fee
  monthlyNrr: 4.2,
  annualNrr: 50.4,
  value: '32000000000000000000', // 32 ETH in wei
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

const mockWithdrawRequestTxInfo: NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit',
  humanDescription: 'Request withdrawal of staked tokens',
  status: 'ACTIVE',
  estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
  estimatedWithdrawalTime: 2 * 86400000, // 2 days in milliseconds
  value: '32000000000000000000', // 32 ETH in wei
  numValidators: 1,
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

describe('Staking Utils', () => {
  describe('formatStakingDepositItems', () => {
    it('formats deposit information correctly with minimal txData', () => {
      const minimalTxData = {
        to: {
          value: '0x1234567890123456789012345678901234567890',
          name: null,
          logoUri: null,
        },
        operation: 0,
      }

      const items = formatStakingDepositItems(mockDepositTxInfo, minimalTxData)

      expect(items).toHaveLength(6)

      const rewardsRateItem = items[0] as { label: string; value: string }
      expect(rewardsRateItem.label).toBe('Rewards rate')
      expect(rewardsRateItem.value).toBe('50.400%')

      const widgetFeeItem = items[3] as { label: string; value: string }
      expect(widgetFeeItem.label).toBe('Widget fee')
      expect(widgetFeeItem.value).toBe('5.00%')

      const contractItem = items[4] as { label: string; render?: () => React.ReactNode }
      expect(contractItem.label).toBe('Contract')
      expect(contractItem.render).toBeDefined()

      const networkItem = items[5] as { label: string; render?: () => React.ReactNode }
      expect(networkItem.label).toBe('Network')
      expect(networkItem.render).toBeDefined()
    })

    it('includes contract and network information when provided', () => {
      const mockTxData = {
        to: {
          value: '0x123456789abcdef123456789abcdef123456789a',
          name: 'Staking Contract',
          logoUri: null,
        },
        operation: 0,
      }

      const items = formatStakingDepositItems(mockDepositTxInfo, mockTxData)

      expect(items).toHaveLength(6) // 4 original + contract + network

      const contractItem = items[4] as { label: string; render?: () => React.ReactNode }
      expect(contractItem.label).toBe('Contract')
      expect(contractItem.render).toBeDefined()

      const networkItem = items[5] as { label: string; render?: () => React.ReactNode }
      expect(networkItem.label).toBe('Network')
      expect(networkItem.render).toBeDefined()
    })

    it('always includes contract and network information', () => {
      const basicTxData = {
        to: {
          value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          name: null,
          logoUri: null,
        },
        operation: 0,
      }

      const items = formatStakingDepositItems(mockDepositTxInfo, basicTxData)

      expect(items).toHaveLength(6)

      const contractItem = items[4] as { label: string; render?: () => React.ReactNode }
      expect(contractItem.label).toBe('Contract')
      expect(contractItem.render).toBeDefined()

      const networkItem = items[5] as { label: string; render?: () => React.ReactNode }
      expect(networkItem.label).toBe('Network')
      expect(networkItem.render).toBeDefined()
    })
  })

  describe('formatStakingValidatorItems', () => {
    it('formats validator information correctly', () => {
      const items = formatStakingValidatorItems(mockDepositTxInfo)

      expect(items).toHaveLength(4)

      const validatorItem = items[0] as { label: string; value: string }
      expect(validatorItem.label).toBe('Validator')
      expect(validatorItem.value).toBe('1')

      const activationTimeItem = items[1] as { label: string }
      expect(activationTimeItem.label).toBe('Activation time')

      const rewardsItem = items[2] as { label: string; value: string }
      expect(rewardsItem.label).toBe('Rewards')
      expect(rewardsItem.value).toBe('Approx. every 5 days after activation')

      const validatorStatusItem = items[3] as { label: string; render?: () => React.ReactNode }
      expect(validatorStatusItem.label).toBe('Validator status')
      expect(validatorStatusItem.render).toBeDefined()
    })
  })

  describe('formatStakingWithdrawRequestItems', () => {
    it('formats withdraw request information correctly', () => {
      const mockTxData = {
        to: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Staking Contract',
          logoUri: null,
        },
        operation: 0,
      }

      const items = formatStakingWithdrawRequestItems(mockWithdrawRequestTxInfo, mockTxData)

      expect(items).toHaveLength(6)

      const contractItem = items[0] as { label: string; render?: () => React.ReactNode }
      expect(contractItem.label).toBe('Contract')
      expect(contractItem.render).toBeDefined()

      const networkItem = items[1] as { label: string; render?: () => React.ReactNode }
      expect(networkItem.label).toBe('Network')
      expect(networkItem.render).toBeDefined()

      const exitItem = items[2] as { label: string; value: string }
      expect(exitItem.label).toBe('Exit')
      expect(exitItem.value).toBe('1 Validator')

      const receiveItem = items[3] as { label: string }
      expect(receiveItem.label).toBe('Receive')

      const withdrawInItem = items[4] as { label: string; value: string }
      expect(withdrawInItem.label).toBe('Withdraw in')
      expect(withdrawInItem.value).toMatch(/Up to.*day/)

      const validatorStatusItem = items[5] as { label: string; render?: () => React.ReactNode }
      expect(validatorStatusItem.label).toBe('Validator status')
      expect(validatorStatusItem.render).toBeDefined()
    })

    it('handles multiple validators correctly', () => {
      const mockTxData = {
        to: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Staking Contract',
          logoUri: null,
        },
        operation: 0,
      }

      const multiValidatorInfo = {
        ...mockWithdrawRequestTxInfo,
        numValidators: 5,
      }

      const items = formatStakingWithdrawRequestItems(multiValidatorInfo, mockTxData)
      const exitItem = items[2] as { label: string; value: string } // Exit is now at index 2

      expect(exitItem.value).toBe('5 Validators')
    })

    it('handles single validator correctly', () => {
      const mockTxData = {
        to: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Staking Contract',
          logoUri: null,
        },
        operation: 0,
      }

      const singleValidatorInfo = {
        ...mockWithdrawRequestTxInfo,
        numValidators: 1,
      }

      const items = formatStakingWithdrawRequestItems(singleValidatorInfo, mockTxData)
      const exitItem = items[2] as { label: string; value: string } // Exit is now at index 2

      expect(exitItem.value).toBe('1 Validator')
    })

    it('renders receive token amount', () => {
      const mockTxData = {
        to: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Staking Contract',
          logoUri: null,
        },
        operation: 0,
      }

      const items = formatStakingWithdrawRequestItems(mockWithdrawRequestTxInfo, mockTxData)
      const receiveItem = items[3] as { label: string; render?: () => React.ReactNode }

      expect(receiveItem).toBeDefined()
      expect(receiveItem.label).toBe('Receive')
      expect(receiveItem.render).toBeDefined()

      if (receiveItem.render) {
        const { getByText } = render(<>{receiveItem.render()}</>)
        expect(getByText(/32.*ETH/)).toBeTruthy()
      }
    })
  })
})
