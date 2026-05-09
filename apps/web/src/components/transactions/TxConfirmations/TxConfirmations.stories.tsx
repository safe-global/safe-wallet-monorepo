import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import TxConfirmations from './index'

const meta: Meta<typeof TxConfirmations> = {
  title: 'Components/Base/TxConfirmations',
  component: TxConfirmations,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 2 }}>
        <Story />
      </Paper>
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
