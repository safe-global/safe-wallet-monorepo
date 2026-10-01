import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_ADDRESSES, MOCK_SAFES, MOCK_SAFE_NAME } from '../../../mocks/policies'
import { createMockStory } from '@/stories/mocks'
import PolicyOverview from './PolicyOverview'

// The Network row reads chain config, so the stories need a store and the chains endpoint.
const setup = createMockStory({ layout: 'none' })

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer/components/PolicyOverview',
  component: PolicyOverview,
  parameters: { ...setup.parameters, layout: 'centered' },
  decorators: [setup.decorator, (Story) => <div className="w-[400px]">{Story()}</div>],
  args: {
    appliesTo: { address: MOCK_SAFES.treasury.address, name: MOCK_SAFE_NAME },
    chainId: MOCK_SAFES.treasury.chainId,
    lastUpdated: '06.24.26 03:35 AM UTC',
    enforcedBy: 'Safe allowance module',
    enforcedByHref: 'https://etherscan.io/address/0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134',
  },
} satisfies Meta<typeof PolicyOverview>

export default meta
type Story = StoryObj<typeof meta>

/** How spending limits render it: CGW returns no initiator, so that row is absent. */
export const Default: Story = {}

/** The optional initiator row, for a policy type that does have one. */
export const WithInitiator: Story = {
  args: { initiatedBy: { address: MOCK_ADDRESSES.alice, name: 'Alice' } },
}
