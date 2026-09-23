import type { Meta, StoryObj } from '@storybook/react'
import AccountIdentity, { AccountIdentitySkeleton } from './AccountIdentity'

const meta = {
  title: 'Features/Spaces/Policies/components/AccountIdentity',
  component: AccountIdentity,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
    name: 'Ops',
  },
} satisfies Meta<typeof AccountIdentity>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** No address book entry — the shortened address stands in for the name. */
export const Unnamed: Story = {
  args: {
    name: undefined,
  },
}

export const LongName: Story = {
  args: {
    name: 'Marketing operations treasury',
  },
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
}

/** The account is still loading — the identicon, name and address stand in as skeletons. */
export const Loading: Story = {
  render: () => <AccountIdentitySkeleton />,
}
