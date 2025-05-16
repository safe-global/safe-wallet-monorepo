import type { Meta, StoryObj } from '@storybook/react'
import { StakingTxExitCard } from '@/src/components/transactions-list/Card/StakingTxExitCard'
import { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

// Mock data for NativeStakingValidatorsExitTransactionInfo
const mockStakingTxExitInfo: NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit' as TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT,
  humanDescription: 'Exit staking validators',
  numValidators: 2,
  status: 'EXITING',
  estimatedExitTime: 1703980800, // Unix timestamp for 2023-12-31
  estimatedWithdrawalTime: 1704585600, // Unix timestamp for 2024-01-07
  value: '32000000000000000000', // 32 ETH in wei
  validators: ['0xvalidator1', '0xvalidator2'],
  tokenInfo: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Common ETH placeholder address
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    name: 'Ethereum',
    symbol: 'ETH',
    trusted: true,
  },
}

const meta: Meta<typeof StakingTxExitCard> = {
  title: 'TransactionsList/StakingTxExitCard',
  component: StakingTxExitCard,
  argTypes: {},
  args: {
    info: mockStakingTxExitInfo,
  },
}

export default meta
type Story = StoryObj<typeof StakingTxExitCard>

export const Default: Story = {}

export const SingleValidator: Story = {
  args: {
    info: {
      ...mockStakingTxExitInfo,
      numValidators: 1,
      validators: ['0xvalidator1'],
    },
  },
}

export const MultipleValidators: Story = {
  args: {
    info: {
      ...mockStakingTxExitInfo,
      numValidators: 5,
      validators: ['0xvalidator1', '0xvalidator2', '0xvalidator3', '0xvalidator4', '0xvalidator5'],
      value: '160000000000000000000', // 160 ETH in wei (5 validators * 32 ETH)
    },
  },
}

export const DifferentToken: Story = {
  args: {
    info: {
      ...mockStakingTxExitInfo,
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
