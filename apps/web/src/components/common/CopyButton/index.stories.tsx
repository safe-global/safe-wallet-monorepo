import type { Meta, StoryObj } from '@storybook/react'
import CopyButton from './index'
const meta = {
  component: CopyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    text: 'Copy',
  },
}
