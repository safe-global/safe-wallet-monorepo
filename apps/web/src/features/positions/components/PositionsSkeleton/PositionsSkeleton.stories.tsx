import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import PositionsSkeleton from './index'

const meta = {
  component: PositionsSkeleton,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 800 }}>
        <Story />
      </Box>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PositionsSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
