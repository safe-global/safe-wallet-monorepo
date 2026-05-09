import type { Meta, StoryObj } from '@storybook/react'
import { createMinimalDecorator } from '@/stories/mocks'
import { RequiredConfirmation } from './index'

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'

const decorator = createMinimalDecorator({
  wallet: 'owner',
  layout: 'paper',
  store: {
    safeInfo: {
      data: {
        address: { value: MOCK_WALLET_ADDRESS },
        chainId: '1',
        owners: [
          { value: MOCK_WALLET_ADDRESS },
          { value: '0xabcdef1234567890abcdef1234567890abcdef12' },
          { value: '0x9876543210fedcba9876543210fedcba98765432' },
        ],
        threshold: 2,
        deployed: true,
      },
      loading: false,
      loaded: true,
    },
  },
})

const meta: Meta<typeof RequiredConfirmation> = {
  title: 'Components/Settings/RequiredConfirmations',
  component: RequiredConfirmation,
  parameters: { layout: 'padded' },
  decorators: [decorator],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { threshold: 2, owners: 3 },
}

export const SingleOwner: Story = {
  args: { threshold: 1, owners: 1 },
}
