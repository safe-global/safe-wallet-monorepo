import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { FeePrototype } from './feePrototype'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const meta = {
  title: 'Prototype/Fee payment/2 · Pro, sponsored left',
  component: FeePrototype,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof FeePrototype>

export default meta
type Story = StoryObj<typeof meta>

export const SponsoredByPro: Story = { name: 'Sponsored by Pro', args: { flowId: 'pro-sponsored' } }

export const SponsoringRanOut: Story = { name: 'Sponsoring ran out before execution', args: { flowId: 'pro-ran-out' } }
