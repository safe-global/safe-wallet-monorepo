import type { Meta, StoryObj } from '@storybook/react'
import AllowlistNotice from './AllowlistNotice'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitFlow/AllowlistNotice',
  component: AllowlistNotice,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AllowlistNotice>

export default meta
type Story = StoryObj<typeof meta>

/** The spending limit setup, once the chosen Safe turns out to have a recipient allowlist. */
export const Default: Story = {}
