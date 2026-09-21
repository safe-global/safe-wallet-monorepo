import type { Meta, StoryObj } from '@storybook/react'
import { NotActivatedPolicy } from './NotActivatedPolicy'

const meta = {
  title: 'Features/Spaces/Policies/PolicyDrawer/variants/NotActivatedPolicy',
  component: NotActivatedPolicy,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NotActivatedPolicy>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
