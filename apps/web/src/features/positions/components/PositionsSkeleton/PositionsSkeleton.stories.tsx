import type { Meta, StoryObj } from '@storybook/react'
import PositionsSkeleton from './index'

const meta = {
  component: PositionsSkeleton,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-[800px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PositionsSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
