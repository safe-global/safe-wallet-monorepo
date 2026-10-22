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

export const SignFirstSigner: Story = { name: 'Sign · First signer', args: { screenId: 'pro-sign-first' } }

export const SignLaterSigner: Story = { name: 'Sign · Later signer', args: { screenId: 'pro-sign-later' } }

export const ExecuteSponsoredOrSignerWallet: Story = {
  name: 'Execute · Sponsored or signer wallet',
  args: { screenId: 'pro-exec-choose' },
}

export const ExecuteSponsoringRanOut: Story = {
  name: 'Execute · Sponsoring ran out',
  args: { screenId: 'pro-exec-ran-out' },
}
