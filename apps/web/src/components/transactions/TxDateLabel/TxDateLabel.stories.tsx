import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import TxDateLabel from './index'

const meta: Meta<typeof TxDateLabel> = {
  title: 'Components/Base/TxDateLabel',
  component: TxDateLabel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 2, maxWidth: 400 }}>
        <Story />
      </Paper>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { item: { type: 'DATE_LABEL', timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 } },
}
