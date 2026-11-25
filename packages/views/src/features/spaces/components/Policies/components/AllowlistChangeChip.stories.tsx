import type { Meta, StoryObj } from '@storybook/react'
import AllowlistChangeChip from './AllowlistChangeChip'

const meta = {
  title: 'Features/Spaces/Policies/components/AllowlistChangeChip',
  component: AllowlistChangeChip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { change: 'edit', variant: 'warning' },
} satisfies Meta<typeof AllowlistChangeChip>

export default meta
type Story = StoryObj<typeof meta>

export const Setup: Story = { args: { change: 'setup' } }

export const Edit: Story = {}

export const Removal: Story = { args: { change: 'removal', variant: 'info' } }

/** The longest change, which the table's change column is sized for. */
export const GuardRemoval: Story = { args: { change: 'guard-removal', variant: 'info' } }

export const Expired: Story = { args: { variant: 'secondary' } }
