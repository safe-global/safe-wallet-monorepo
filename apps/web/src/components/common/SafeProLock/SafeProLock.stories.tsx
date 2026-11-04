import type { Meta, StoryObj } from '@storybook/react'
import { UpgradeFeature } from '@/services/analytics'
import SafeProLock from './index'

const meta = {
  title: 'Components/Common/SafeProLock',
  component: SafeProLock,
  args: { title: 'Adding proposers requires Safe Pro', href: '/spaces/plans', feature: UpgradeFeature.PROPOSERS },
} satisfies Meta<typeof SafeProLock>

export default meta
type Story = StoryObj<typeof meta>

export const Proposers: Story = {}

export const SpendingLimits: Story = {
  args: { title: 'Adding spending limits requires Safe Pro', feature: UpgradeFeature.SPENDING_LIMITS },
}
