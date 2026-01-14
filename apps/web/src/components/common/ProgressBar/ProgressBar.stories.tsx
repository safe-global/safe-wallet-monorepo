import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import { ProgressBar } from './index'

const meta = {
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ width: 300 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    value: 0,
  },
}

export const Partial: Story = {
  args: {
    value: 45,
  },
}

export const AlmostComplete: Story = {
  args: {
    value: 85,
  },
}

export const Complete: Story = {
  args: {
    value: 100,
  },
}
