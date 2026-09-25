import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { PENDING_BANNER_TITLE, signAndExecuteLine } from '../../copy'
import SpendingLimitActions from './SpendingLimitActions'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer/components/SpendingLimitActions',
  component: SpendingLimitActions,
  parameters: { layout: 'centered' },
  args: {
    transactionLink: 'https://app.safe.global/transactions/tx?id=0x9f3c',
    onEdit: fn(),
    onReviewTransaction: fn(),
    onConnectWallet: fn(),
  },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
} satisfies Meta<typeof SpendingLimitActions>

export default meta
type Story = StoryObj<typeof meta>

export const Connect: Story = {
  args: {
    state: { kind: 'active', action: 'connect', disabled: false, helper: 'Connect a signer wallet to edit.' },
  },
}

export const Review: Story = {
  args: {
    state: {
      kind: 'pending',
      operation: 'create',
      action: 'review',
      bannerTitle: PENDING_BANNER_TITLE.create,
      bannerLine2: signAndExecuteLine('create'),
      signed: 1,
      required: 2,
    },
  },
}

export const Manage: Story = {
  args: { state: { kind: 'active', action: 'manage', disabled: false } },
}

export const ManageDisabled: Story = {
  args: {
    state: {
      kind: 'active',
      action: 'manage',
      disabled: true,
      helper: 'Only signers of this Safe account can delete or edit this spending limit.',
    },
  },
}

export const CopyLink: Story = {
  args: {
    state: {
      kind: 'pending',
      operation: 'create',
      action: 'copy-link',
      bannerTitle: PENDING_BANNER_TITLE.create,
      signed: 1,
      required: 2,
    },
  },
}
