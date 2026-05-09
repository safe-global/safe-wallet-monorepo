import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { ThresholdWarning, UnsignedWarning } from './index'

const meta: Meta = {
  title: 'Components/Transactions/Warning',
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 3, maxWidth: 600 }}>
        <Story />
      </Paper>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Threshold: Story = {
  render: () => <ThresholdWarning />,
}

export const Untrusted: Story = {
  render: () => <UnsignedWarning />,
}
