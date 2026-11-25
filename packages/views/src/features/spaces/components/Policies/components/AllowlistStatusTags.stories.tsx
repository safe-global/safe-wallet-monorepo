import type { Meta, StoryObj } from '@storybook/react'
import { ALLOWLIST_STATUS, formatAllowlistStatus } from '../allowlistStatus'
import AllowlistStatusTags from './AllowlistStatusTags'

const meta = {
  title: 'Features/Spaces/Policies/components/AllowlistStatusTags',
  component: AllowlistStatusTags,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    badge: {
      state: 'edit-apply-pending',
      change: 'edit',
      label: formatAllowlistStatus('edit-apply-pending', { signed: 1, required: 2 }),
      variant: ALLOWLIST_STATUS['edit-apply-pending'].variant,
    },
  },
} satisfies Meta<typeof AllowlistStatusTags>

export default meta
type Story = StoryObj<typeof meta>

export const ApplyPending: Story = {}

/** An allowlist in no change shows its status alone. */
export const Active: Story = {
  args: { badge: { state: 'active', label: 'Active', variant: ALLOWLIST_STATUS.active.variant } },
}

export const Expired: Story = {
  args: {
    badge: {
      state: 'removal-expired',
      change: 'removal',
      label: formatAllowlistStatus('removal-expired'),
      variant: ALLOWLIST_STATUS['removal-expired'].variant,
    },
  },
}

/** Too wide for the panel header beside the title, so the status wraps under the change. */
export const Narrow: Story = {
  args: {
    badge: {
      state: 'guard-removal-ready-to-execute',
      change: 'guard-removal',
      label: formatAllowlistStatus('guard-removal-ready-to-execute'),
      variant: ALLOWLIST_STATUS['guard-removal-ready-to-execute'].variant,
    },
  },
  decorators: [(Story) => <div className="w-48">{Story()}</div>],
}
