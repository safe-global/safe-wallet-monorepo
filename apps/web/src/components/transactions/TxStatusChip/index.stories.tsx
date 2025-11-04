import type { Meta, StoryObj } from '@storybook/react'
import StatusChip from './index'
import { Paper } from '@mui/material'

const meta = {
  component: StatusChip,
  parameters: {
    componentSubtitle: 'Renders a token Amount with Token Symbol and Logo',
  },

  decorators: [
    (Story) => {
      return (
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof StatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Processing',
  },
}
