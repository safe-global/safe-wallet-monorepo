import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { FeePrototype } from './feePrototype'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const meta = {
  title: 'Prototype/Fee payment/1 · Free plan',
  component: FeePrototype,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof FeePrototype>

export default meta
type Story = StoryObj<typeof meta>

export const PayFromSafeAccount: Story = { name: 'Pay from Safe account', args: { flowId: 'free-safe' } }

export const PayFromSignerWallet: Story = { name: 'Pay from signer wallet', args: { flowId: 'free-signer' } }
