import type { Meta, StoryObj } from '@storybook/react'
import CopyTransactionLink from './CopyTransactionLink'

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitDrawer/components/CopyTransactionLink',
  component: CopyTransactionLink,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
} satisfies Meta<typeof CopyTransactionLink>

export default meta
type Story = StoryObj<typeof CopyTransactionLink>

export const Default: Story = {
  args: { transactionLink: 'https://app.safe.global/transactions/tx?id=0x9f3c&safe=eth:0x8675' },
}
