import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import {
  SafeProNoticeModal,
  SafeProPendingModal,
  SafeProPlanSwitchedModal,
  SafeProSubscriptionActivatedModal,
  SafeProTrialActivatedModal,
} from './index'

const TRIAL_ENDS_AT = Date.UTC(2026, 11, 6, 12)

const meta = {
  title: 'Features/Spaces/SafeProModals',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const TrialActivated: Story = {
  render: () => <SafeProTrialActivatedModal open onOpenChange={fn()} trialEndsAt={TRIAL_ENDS_AT} />,
}

export const TrialActivatedWithPaymentMethod: Story = {
  render: () => <SafeProTrialActivatedModal open onOpenChange={fn()} trialEndsAt={TRIAL_ENDS_AT} hasPaymentMethod />,
}

export const SubscriptionActivated: Story = {
  render: () => (
    <SafeProSubscriptionActivatedModal open onOpenChange={fn()} planName="Business" seatsLabel="5 Safe accounts" />
  ),
}

export const PlanSwitched: Story = {
  render: () => (
    <SafeProPlanSwitchedModal
      open
      onOpenChange={fn()}
      planName="Starter"
      trialEndsAt={TRIAL_ENDS_AT}
      price="€189/mo"
      seatsLabel="2 Safe accounts"
    />
  ),
}

/** Spinner animates, so the snapshot is skipped. */
export const Pending: Story = {
  tags: ['skip-visual-test'],
  render: () => <SafeProPendingModal title="Confirming your subscription" body="This usually takes a few seconds." />,
}

/** A locked Workspace: no close button, one way out. */
export const NoticeLocked: Story = {
  render: () => (
    <SafeProNoticeModal
      open
      title="Your free access ended on Dec 5, 2026"
      body="An admin needs to choose a plan to unlock it."
      onAction={fn()}
      secondaryActionLabel="Create new Workspace"
      secondaryActionHref="/welcome/spaces"
    />
  ),
}

export const NoticeDismissible: Story = {
  render: () => (
    <SafeProNoticeModal
      open
      title="Your free access will end in 7 days"
      body="Acme Inc will be locked on Dec 5, 2026."
      actionLabel="Got it"
      onAction={fn()}
      onOpenChange={fn()}
    />
  ),
}
