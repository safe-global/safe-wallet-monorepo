import type { Meta, StoryObj } from '@storybook/react'
import { DateTime } from './DateTime'

const meta = {
  component: DateTime,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DateTime>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 1712552729000,
    showDateTime: true,
    showTime: true,
  },
}
