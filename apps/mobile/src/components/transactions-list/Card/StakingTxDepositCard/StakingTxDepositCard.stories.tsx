import type { Meta, StoryObj } from '@storybook/react'
import { StakingTxDepositCard } from '@/src/components/transactions-list/Card/StakingTxDepositCard'
import { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

// Mock data for NativeStakingDepositTransactionInfo
const mockStakingTxDepositInfo: NativeStakingDepositTransactionInfo = {
  type: 'NativeStakingDeposit' as TransactionInfoType.NATIVE_STAKING_DEPOSIT,
  humanDescription: 'Deposit tokens for staking',
  status: 'ACTIVE',
  estimatedEntryTime: Date.now() + 86400000, // 1 day from now
  estimatedExitTime: Date.now() + 30 * 86400000, // 30 days from now
  estimatedWithdrawalTime: Date.now() + 32 * 86400000, // 32 days from now
  fee: 5, // 5% fee
  monthlyNrr: 4.2, // 4.2% monthly return
  annualNrr: 50.4, // 50.4% annual return
  value: '1000000000000000000', // 1 ETH in wei
  numValidators: 1,
  expectedAnnualReward: '50400000000000000', // 0.0504 ETH
  expectedMonthlyReward: '4200000000000000', // 0.0042 ETH
  expectedFiatAnnualReward: 151.2, // $151.2 assuming 1 ETH = $300
  expectedFiatMonthlyReward: 12.6, // $12.6
  tokenInfo: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Common ETH placeholder address
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    name: 'Ethereum',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0xvalidator1', '0xvalidator2'],
}

const meta: Meta<typeof StakingTxDepositCard> = {
  title: 'TransactionsList/StakingTxDepositCard',
  component: StakingTxDepositCard,
  argTypes: {},
  args: {
    info: mockStakingTxDepositInfo,
  },
}

export default meta
type Story = StoryObj<typeof StakingTxDepositCard>

export const Default: Story = {}

export const CustomAmount: Story = {
  args: {
    info: {
      ...mockStakingTxDepositInfo,
      value: '5000000000000000000', // 5 ETH in wei
    },
  },
}

export const DifferentToken: Story = {
  args: {
    info: {
      ...mockStakingTxDepositInfo,
      tokenInfo: {
        address: '0x1111111111',
        decimals: 18,
        logoUri:
          'https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png',
        name: 'SafeToken',
        symbol: 'SAFE',
        trusted: true,
      },
    },
  },
}
