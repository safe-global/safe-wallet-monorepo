import type { Meta, StoryObj } from '@storybook/react'
import Policies from './index'

const meta = {
  title: 'Features/Spaces/Policies',
  component: Policies,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Policies>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
