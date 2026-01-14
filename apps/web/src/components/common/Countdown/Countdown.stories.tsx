import type { Meta, StoryObj } from '@storybook/react'
import { Countdown } from './index'

const meta = {
  component: Countdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Countdown>

export default meta
type Story = StoryObj<typeof meta>

export const LessThanOneMinute: Story = {
  args: {
    seconds: 45,
  },
}

export const Minutes: Story = {
  args: {
    seconds: 300, // 5 minutes
  },
}

export const Hours: Story = {
  args: {
    seconds: 7200, // 2 hours
  },
}

export const HoursAndMinutes: Story = {
  args: {
    seconds: 7500, // 2 hours 5 minutes
  },
}

export const Days: Story = {
  args: {
    seconds: 172800, // 2 days
  },
}

export const DaysHoursMinutes: Story = {
  args: {
    seconds: 180900, // 2 days 2 hours 15 minutes
  },
}

export const Zero: Story = {
  args: {
    seconds: 0,
  },
}
