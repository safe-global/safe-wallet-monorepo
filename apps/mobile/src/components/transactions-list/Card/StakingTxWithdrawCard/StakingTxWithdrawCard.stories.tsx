import type { Meta, StoryObj } from '@storybook/react'
import { StakingTxWithdrawCard } from '@/src/components/transactions-list/Card/StakingTxWithdrawCard'
import { NativeStakingWithdrawTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

// Mock data for NativeStakingWithdrawTransactionInfo
const mockStakingTxWithdrawInfo: NativeStakingWithdrawTransactionInfo = {
  type: 'NativeStakingWithdraw' as TransactionInfoType.NATIVE_STAKING_WITHDRAW,
  humanDescription: 'Withdraw staked tokens',
  value: '1000000000000000000', // 1 ETH in wei
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

const meta: Meta<typeof StakingTxWithdrawCard> = {
  title: 'TransactionsList/StakingTxWithdrawCard',
  component: StakingTxWithdrawCard,
  argTypes: {},
  args: {
    info: mockStakingTxWithdrawInfo,
  },
}

export default meta
type Story = StoryObj<typeof StakingTxWithdrawCard>

export const Default: Story = {}

export const CustomAmount: Story = {
  args: {
    info: {
      ...mockStakingTxWithdrawInfo,
      value: '5000000000000000000', // 5 ETH in wei
    },
  },
}

export const DifferentToken: Story = {
  args: {
    info: {
      ...mockStakingTxWithdrawInfo,
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
