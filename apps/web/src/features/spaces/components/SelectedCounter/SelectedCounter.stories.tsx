import type { Meta, StoryObj } from '@storybook/react'
import SelectedCounter, { safeLimitTooltip } from './index'

const meta = {
  title: 'Features/Spaces/SelectedCounter',
  component: SelectedCounter,
  parameters: { layout: 'centered' },
  args: { count: 3, limit: 20, isAtLimit: false, tooltip: safeLimitTooltip(20) },
} satisfies Meta<typeof SelectedCounter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AtLimit: Story = { args: { count: 20, isAtLimit: true } }

export const NoLimit: Story = { args: { limit: null, tooltip: safeLimitTooltip(null) } }

export const Usage: Story = { args: { showSelected: false } }
