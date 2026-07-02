import type { Meta, StoryObj } from '@storybook/react'
import PlanStatusModal from './PlanStatusModal'
import { PLAN_STATUS_MOCKS } from './mocks'

const meta = {
  title: 'Features/Gtf/PlanStatusModal',
  component: PlanStatusModal,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: () => {} },
} satisfies Meta<typeof PlanStatusModal>

export default meta
type Story = StoryObj<typeof meta>

export const NoWorkspace: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.noWorkspace },
}

export const StarterWithinLimit: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.starterWithin },
}

export const StarterLimitReached: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.starterLimit },
}

export const ProWithinLimit: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.proWithin },
}

export const ProApproachingLimit: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.proApproaching },
}

export const ProPaymentFailed: Story = {
  args: { planStatus: PLAN_STATUS_MOCKS.proFailed },
}
