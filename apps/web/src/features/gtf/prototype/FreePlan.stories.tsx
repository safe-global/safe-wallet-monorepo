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

export const SignFirstSigner: Story = { name: 'Sign · First signer', args: { screenId: 'free-sign-first' } }

export const SignLaterSignerSafeLocked: Story = {
  name: 'Sign · Later signer, Safe account locked',
  args: { screenId: 'free-sign-later-safe' },
}

export const SignLaterSignerSignerWallet: Story = {
  name: 'Sign · Later signer, signer wallet picked',
  args: { screenId: 'free-sign-later-signer' },
}

export const SignLastSignerSignAndExecute: Story = {
  name: 'Sign · Last signer, sign and execute',
  args: { screenId: 'free-sign-last-safe' },
}

export const ExecuteSafeLocked: Story = { name: 'Execute · Safe account locked', args: { screenId: 'free-exec-safe' } }

export const ExecuteSignerWalletOnly: Story = {
  name: 'Execute · Signer wallet only',
  args: { screenId: 'free-exec-signer' },
}
