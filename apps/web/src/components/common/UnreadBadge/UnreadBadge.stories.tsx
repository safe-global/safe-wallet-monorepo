import type { Meta, StoryObj } from '@storybook/react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <Button variant="ghost" size="icon">
        <Bell className="size-4" />
      </Button>
    ),
  },
}

export const WithCount: Story = {
  args: {
    count: 5,
    children: (
      <Button variant="ghost" size="icon">
        <Bell className="size-4" />
      </Button>
    ),
  },
}

export const HighCount: Story = {
  args: {
    count: 99,
    children: (
      <Button variant="ghost" size="icon">
        <Bell className="size-4" />
      </Button>
    ),
  },
}

export const Invisible: Story = {
  args: {
    invisible: true,
    children: (
      <Button variant="ghost" size="icon">
        <Bell className="size-4" />
      </Button>
    ),
  },
}
