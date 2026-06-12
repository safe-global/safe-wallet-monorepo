import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent } from '@/components/ui/card'
import { DelegateCallWarning, ThresholdWarning, UnsignedWarning } from './index'
import { Operation } from '@safe-global/store/gateway/types'

const meta: Meta = {
  title: 'Components/Transactions/Warning',
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Card className="max-w-xl py-0 shadow-none">
        <CardContent className="px-6 py-6">
          <Story />
        </CardContent>
      </Card>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const DelegateCall: Story = {
  render: () => (
    <DelegateCallWarning
      showWarning
      txData={{
        operation: Operation.DELEGATE,
        trustedDelegateCallTarget: true,
        to: { value: '0x0000000000000000000000000000000000000001' },
        value: '0',
      }}
    />
  ),
}

export const UnexpectedDelegateCall: Story = {
  render: () => (
    <DelegateCallWarning
      showWarning
      txData={{
        operation: Operation.DELEGATE,
        trustedDelegateCallTarget: false,
        to: { value: '0x0000000000000000000000000000000000000001' },
        value: '0',
      }}
    />
  ),
}

export const Threshold: Story = {
  render: () => <ThresholdWarning />,
}

export const Untrusted: Story = {
  render: () => <UnsignedWarning />,
}
