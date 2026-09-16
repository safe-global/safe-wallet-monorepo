import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import VaultDepositConfirmation from './index'
import { mockVaultDepositTxInfo, mockVaultDepositTxInfoWithoutAdditionalRewards } from './mockData'

const meta = {
  title: 'Features/Earn/VaultDepositConfirmation',
  component: VaultDepositConfirmation,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof VaultDepositConfirmation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    txInfo: mockVaultDepositTxInfo,
    isTxDetails: false,
  },
}

export const WithoutAdditionalRewards: Story = {
  args: {
    txInfo: mockVaultDepositTxInfoWithoutAdditionalRewards,
    isTxDetails: false,
  },
}

export const TxDetails: Story = {
  args: {
    txInfo: mockVaultDepositTxInfo,
    isTxDetails: true,
  },
}
