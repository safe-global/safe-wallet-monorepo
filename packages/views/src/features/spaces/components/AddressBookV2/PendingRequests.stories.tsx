import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@safe-global/views/components/common/Identicon'
import TableCard from '@safe-global/views/components/common/TableCard'
import PendingRequests from './PendingRequests'
import { PENDING_REQUESTS } from './mocks/fixtures'

const meta = {
  title: 'Features/Spaces/AddressBookV2/PendingRequests',
  component: PendingRequests,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <TableCard>{Story()}</TableCard>],
  args: {
    requests: PENDING_REQUESTS,
    canReview: true,
    onApprove: fn(),
    onReject: fn(),
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
    getExplorerLink: (address: string) => ({
      href: `https://etherscan.io/address/${address}`,
      title: 'View on etherscan.io',
    }),
  },
} satisfies Meta<typeof PendingRequests>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}

export const Reviewing: Story = { args: { reviewingId: PENDING_REQUESTS[0].id } }

/** A member sees only their own requests, without Accept or Decline. */
export const Member: Story = { args: { canReview: false, requests: PENDING_REQUESTS.slice(0, 1) } }

export const AdminEmpty: Story = { args: { requests: [] } }

export const MemberEmpty: Story = { args: { canReview: false, requests: [] } }

const LONG = ' with a name long enough to need truncating'

/** Long names in a 1000px container, where the Contact column used to run over Chains. */
export const LongTextNarrow: Story = {
  decorators: [(Story) => <div className="w-[1000px]">{Story()}</div>],
  args: {
    requests: PENDING_REQUESTS.map((request) => ({
      ...request,
      name: request.name + LONG,
      requestedBy: request.requestedBy && request.requestedBy + LONG,
    })),
  },
}
