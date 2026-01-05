import type { Meta, StoryObj } from '@storybook/react'
import { IconButton } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import UnreadBadge from './index'

const meta = {
  component: UnreadBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UnreadBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Dot: Story = {
  args: {
    children: (
      <IconButton>
        <NotificationsIcon />
      </IconButton>
    ),
  },
}

export const WithCount: Story = {
  args: {
    count: 5,
    children: (
      <IconButton>
        <NotificationsIcon />
      </IconButton>
    ),
  },
}

export const HighCount: Story = {
  args: {
    count: 99,
    children: (
      <IconButton>
        <NotificationsIcon />
      </IconButton>
    ),
  },
}

export const Invisible: Story = {
  args: {
    invisible: true,
    children: (
      <IconButton>
        <NotificationsIcon />
      </IconButton>
    ),
  },
}
