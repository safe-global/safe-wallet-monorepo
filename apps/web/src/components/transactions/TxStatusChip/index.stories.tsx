import type { Meta, StoryObj } from '@storybook/react'
import { Check, Clock } from 'lucide-react'
import StatusChip from './index'

const meta: Meta<typeof StatusChip> = {
  title: 'Components/Transactions/TxStatusChip',
  component: StatusChip,
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

export const Default: Story = {
  args: { children: 'Processing' },
}

export const Success: Story = {
  args: {
    color: 'success',
    children: (
      <>
        <Check className="size-4" /> Executed
      </>
    ),
  },
}

export const Warning: Story = {
  args: {
    color: 'warning',
    children: (
      <>
        <Clock className="size-4" /> Pending
      </>
    ),
  },
}
