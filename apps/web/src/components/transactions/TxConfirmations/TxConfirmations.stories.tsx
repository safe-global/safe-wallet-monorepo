import type { Meta, StoryObj } from '@storybook/react'
import TxConfirmations from './index'

const meta: Meta<typeof TxConfirmations> = {
  title: 'Components/Transactions/TxConfirmations',
  component: TxConfirmations,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
  args: { requiredConfirmations: 3, submittedConfirmations: 1 },
}

export const Confirmed: Story = {
  args: { requiredConfirmations: 3, submittedConfirmations: 3 },
}
