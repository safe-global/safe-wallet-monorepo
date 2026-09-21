import type { Meta, StoryObj } from '@storybook/react'
import { ActivePolicy } from './ActivePolicy'

const meta = {
  title: 'Features/Spaces/Policies/PolicyDrawer/ActivePolicy',
  component: ActivePolicy,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivePolicy>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
