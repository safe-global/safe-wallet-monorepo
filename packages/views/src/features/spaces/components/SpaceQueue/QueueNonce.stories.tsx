import type { Meta, StoryObj } from '@storybook/react'
import QueueNonce from './QueueNonce'

const meta = {
  title: 'Features/Spaces/Transactions/QueueNonce',
  component: QueueNonce,
  parameters: { layout: 'centered' },
  args: { nonce: 42, state: 'Ready to sign', hint: 'Next in line. Needs your signature.', defaultOpen: true },
} satisfies Meta<typeof QueueNonce>

export default meta
type Story = StoryObj<typeof meta>

export const ReadyToSign: Story = {}

export const Blocked: Story = { args: { state: 'Blocked', hint: "Blocked. It can't run until #40 executes." } }

/** The conflict header's nonce: the conflict row's tooltip */
export const Conflicting: Story = {
  args: {
    state: 'Conflicting transaction',
    hint: '3 conflicting transactions share this nonce; only one can execute.',
  },
}
