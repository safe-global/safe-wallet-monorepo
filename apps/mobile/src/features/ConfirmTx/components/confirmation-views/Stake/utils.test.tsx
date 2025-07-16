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
    it('formats deposit information correctly', () => {
      const items = formatStakingDepositItems(mockDepositTxInfo)

      expect(items).toHaveLength(4)

      const rewardsRateItem = items[0] as { label: string; value: string }
      expect(rewardsRateItem.label).toBe('Rewards rate')
      expect(rewardsRateItem.value).toBe('50.400%')

      const widgetFeeItem = items[3] as { label: string; value: string }
      expect(widgetFeeItem.label).toBe('Widget fee')
      expect(widgetFeeItem.value).toBe('5.00%')
    })
  })

  describe('formatStakingValidatorItems', () => {
    it('formats validator information correctly', () => {
      const items = formatStakingValidatorItems(mockDepositTxInfo)

      expect(items).toHaveLength(3)

      const validatorItem = items[0] as { label: string; value: string }
      expect(validatorItem.label).toBe('Validator')
      expect(validatorItem.value).toBe('1')

      const activationTimeItem = items[1] as { label: string }
      expect(activationTimeItem.label).toBe('Activation time')

      const rewardsItem = items[2] as { label: string; value: string }
      expect(rewardsItem.label).toBe('Rewards')
      expect(rewardsItem.value).toBe('Approx. every 5 days after activation')
    })
  })

  describe('formatStakingWithdrawRequestItems', () => {
    it('formats withdraw request information correctly', () => {
      const items = formatStakingWithdrawRequestItems(mockWithdrawRequestTxInfo)

      expect(items).toHaveLength(3)

      const exitItem = items[0] as { label: string; value: string }
      expect(exitItem.label).toBe('Exit')
      expect(exitItem.value).toBe('1 Validator')

      const receiveItem = items[1] as { label: string }
      expect(receiveItem.label).toBe('Receive')

      const withdrawInItem = items[2] as { label: string; value: string }
      expect(withdrawInItem.label).toBe('Withdraw in')
      expect(withdrawInItem.value).toMatch(/Up to.*day/)
    })

    it('handles multiple validators correctly', () => {
      const multiValidatorInfo = {
        ...mockWithdrawRequestTxInfo,
        numValidators: 5,
      }

      const items = formatStakingWithdrawRequestItems(multiValidatorInfo)
      const exitItem = items[0] as { label: string; value: string }

      expect(exitItem.value).toBe('5 Validators')
    })

    it('handles single validator correctly', () => {
      const singleValidatorInfo = {
        ...mockWithdrawRequestTxInfo,
        numValidators: 1,
      }

      const items = formatStakingWithdrawRequestItems(singleValidatorInfo)
      const exitItem = items[0] as { label: string; value: string }

      expect(exitItem.value).toBe('1 Validator')
    })

    it('renders receive token amount', () => {
      const items = formatStakingWithdrawRequestItems(mockWithdrawRequestTxInfo)
      const receiveItem = items.find((_item, index) => index === 1) as { label: string; render?: () => React.ReactNode }

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
