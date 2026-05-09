import type { Meta, StoryObj } from '@storybook/react'
import StatusChip from './index'
import { Paper } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ScheduleIcon from '@mui/icons-material/Schedule'

const meta: Meta<typeof StatusChip> = {
  title: 'Components/Base/TxStatusChip',
  component: StatusChip,
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

export const Default: Story = {
  args: { children: 'Processing' },
}

export const Success: Story = {
  args: {
    color: 'success',
    children: (
      <>
        <CheckIcon fontSize="small" /> Executed
      </>
    ),
  },
}

export const Warning: Story = {
  args: {
    color: 'warning',
    children: (
      <>
        <ScheduleIcon fontSize="small" /> Pending
      </>
    ),
  },
}
