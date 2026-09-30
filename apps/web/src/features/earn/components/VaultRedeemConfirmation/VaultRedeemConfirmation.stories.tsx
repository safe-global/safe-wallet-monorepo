import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import VaultRedeemConfirmation from './index'
import { mockVaultRedeemTxInfo, mockVaultRedeemTxInfoWithoutAdditionalRewards } from './mockData'

const meta = {
  title: 'Features/Earn/VaultRedeemConfirmation',
  component: VaultRedeemConfirmation,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="rounded-lg bg-card p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs', 'skip-visual-test'],
  parameters: {
    visualTest: { disable: true },
  },
} satisfies Meta<typeof VaultRedeemConfirmation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    txInfo: mockVaultRedeemTxInfo,
    isTxDetails: false,
  },
}

export const WithoutAdditionalRewards: Story = {
  args: {
    txInfo: mockVaultRedeemTxInfoWithoutAdditionalRewards,
    isTxDetails: false,
  },
}

export const TxDetails: Story = {
  args: {
    txInfo: mockVaultRedeemTxInfo,
    isTxDetails: true,
  },
}
