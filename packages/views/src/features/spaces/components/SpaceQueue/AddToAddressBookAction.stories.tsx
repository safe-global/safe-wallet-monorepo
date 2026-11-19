import type { Meta, StoryObj } from '@storybook/react'
import AddToAddressBookAction from './AddToAddressBookAction'

const meta = {
  title: 'Features/Spaces/Transactions/AddToAddressBookAction',
  component: AddToAddressBookAction,
  parameters: { layout: 'padded' },
  args: { onClick: () => {} },
} satisfies Meta<typeof AddToAddressBookAction>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Beside an unnamed address, as in the queue's counterparty column */
export const BesideAddress: Story = {
  render: (args) => (
    <span className="flex items-center gap-2 text-sm">
      0xA213…379f
      <AddToAddressBookAction {...args} />
    </span>
  ),
}
