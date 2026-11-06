import type { Meta, StoryObj } from '@storybook/react'
import ProTrialBanner from './index'

const NOV_6 = new Date(2026, 10, 6).getTime()

const meta = {
  title: 'Features/Spaces/ProTrialBanner',
  component: ProTrialBanner,
  parameters: { layout: 'padded' },
  args: {
    endsAt: NOV_6,
    daysLeft: 12,
    isUrgent: false,
    planName: 'Business 10',
    plansHref: '/spaces/plans',
    talkToUsHref: 'https://example.com',
  },
} satisfies Meta<typeof ProTrialBanner>

export default meta
type Story = StoryObj<typeof meta>

/** More than 3 days left: one quiet line. */
export const Normal: Story = {}

export const ThreeDaysLeft: Story = { args: { daysLeft: 3, isUrgent: true } }

export const TwoDaysLeft: Story = { args: { daysLeft: 2, isUrgent: true } }

export const OneDayLeft: Story = { args: { daysLeft: 1, isUrgent: true } }

export const LastDay: Story = { args: { daysLeft: 0, isUrgent: true } }

/** A member who can't buy sees the status without the Upgrade button. */
export const UrgentMember: Story = { args: { daysLeft: 2, isUrgent: true, canUpgrade: false } }

/** Narrow screens wrap the actions under the status line. */
export const Mobile: Story = {
  args: { daysLeft: 2, isUrgent: true },
  decorators: [(Story) => <div className="w-[343px]">{Story()}</div>],
}
