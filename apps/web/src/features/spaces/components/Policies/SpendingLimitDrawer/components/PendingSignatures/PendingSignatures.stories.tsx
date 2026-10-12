import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_SAFES, MOCK_SAFE_NAME, mockPendingPolicy, mockFullySignedPending } from '../../../mocks/policies'
import PendingSignatures from './PendingSignatures'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer/components/PendingSignatures',
  component: PendingSignatures,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
} satisfies Meta<typeof PendingSignatures>

export default meta
type Story = StoryObj<typeof PendingSignatures>

const { confirmationsSubmitted, confirmationsRequired } = mockPendingPolicy()
const fullySigned = mockFullySignedPending()

export const PartiallySigned: Story = {
  args: {
    safe: { address: MOCK_SAFES.treasury.address, name: MOCK_SAFE_NAME },
    signed: confirmationsSubmitted,
    required: confirmationsRequired,
  },
}

export const FullySigned: Story = {
  args: {
    safe: { address: MOCK_SAFES.treasury.address, name: MOCK_SAFE_NAME },
    signed: fullySigned.confirmationsSubmitted,
    required: fullySigned.confirmationsRequired,
  },
}
